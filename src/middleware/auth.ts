import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../lib/firebase-admin.ts";
import { DecodedIdToken } from "firebase-admin/auth";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: {
    id: number;
    uid: string;
    email: string;
    role: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non autorisé : Token introuvable" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    // Synchronisation de l'utilisateur avec la base SQL
    const userEmail = decodedToken.email || "inconnu@comptabilite.pro";
    const userUid = decodedToken.uid;

    let dbUserResult = await db.select().from(users).where(eq(users.uid, userUid));
    
    if (dbUserResult.length === 0) {
      // Déterminer le rôle : premier utilisateur admin, autres lecteurs par défaut
      const existingCount = await db.select().from(users);
      const role = existingCount.length === 0 ? "admin" : "lecteur";

      const inserted = await db.insert(users).values({
        uid: userUid,
        email: userEmail,
        role: role,
      }).returning();
      
      req.dbUser = inserted[0];
    } else {
      req.dbUser = dbUserResult[0];
    }

    next();
  } catch (error) {
    console.error("Erreur de vérification du token Firebase :", error);
    return res.status(401).json({ error: "Non autorisé : Token invalide" });
  }
};
