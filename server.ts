import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { db } from "./src/db/index.ts";
import { 
  users, 
  services, 
  newsArticles, 
  events, 
  birthDeclarations, 
  marriageDossiers, 
  nationalIdRequests, 
  buildingPermits, 
  workAuthorizations, 
  contactMessages, 
  notifications 
} from "./src/db/schema.ts";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// DB BOOTSTRAP: CREATE TABLES IF NOT EXIST & SEED
// ==========================================
async function ensureTablesAndSeed() {
  try {
    console.log("Checking and seeding default municipal data...");

    // Seeding default services
    const currentServices = await db.select().from(services);
    if (currentServices.length === 0) {
      await db.insert(services).values([
        {
          slug: "acte-naissance",
          name: "Declaration de Naissance",
          description: "Déclarez une nouvelle naissance et faites une demande pour obtenir l'acte authentique numérisé.",
          categorySlug: "etat-civil",
          icon: "Baby",
          estimatedTime: "2 à 3 jours ouvrables",
          requiredDocuments: "Certificat de naissance de la maternité\nCopie de la CNI des parents\nActe de mariage des parents (si applicable)",
          feeAmount: "0.00",
        },
        {
          slug: "mariage",
          name: "Dossier de Mariage",
          description: "Préparez votre dossier de célébration de mariage à l'Hôtel de Ville de Libreville.",
          categorySlug: "etat-civil",
          icon: "Heart",
          estimatedTime: "10 jours ouvrables",
          requiredDocuments: "Actes de naissance des futurs époux (datant de moins de 3 mois)\nCopies des CNI des mariés et des témoins\nCertificat prénuptial\nJustificatif de domicile",
          feeAmount: "15000.00",
        },
        {
          slug: "cni",
          name: "Carte Nationale d'Identité & Passeport",
          description: "Formulaire de pré-demande numérique pour l'obtention ou le renouvellement de votre pièce d'identité.",
          categorySlug: "etat-civil",
          icon: "FolderCheck",
          estimatedTime: "15 jours ouvrables",
          requiredDocuments: "Copie d'acte de naissance certifiée\nCertificat de nationalité gabonaise\nJustificatif de domicile\nAncienne carte (en cas de renouvellement)",
          feeAmount: "5000.00",
        },
        {
          slug: "permis-de-construire",
          name: "Permis de Construire",
          description: "Demande officielle de permis de construire pour tout projet immobilier résidentiel ou commercial dans la commune.",
          categorySlug: "urbanisme",
          icon: "Home",
          estimatedTime: "30 jours ouvrables",
          requiredDocuments: "Titre de propriété / Attestation d'attribution foncière\nPlans d'architecture complets (échelle 1/50 ou 1/100)\nNote descriptive des travaux\nÉtude d'impact environnemental (selon projet)",
          feeAmount: "75000.00",
        },
        {
          slug: "autorisation-travaux",
          name: "Autorisation de Travaux",
          description: "Demande d'autorisation de voirie, d'aménagement ou de travaux mineurs dans la commune de Libreville.",
          categorySlug: "urbanisme",
          icon: "Wrench",
          estimatedTime: "7 jours ouvrables",
          requiredDocuments: "Plan d'implantation des travaux\nDescriptif technique des modifications\nAttestation d'assurance responsabilité civile",
          feeAmount: "10000.00",
        }
      ]);
      console.log("Services seeded.");
    }

    // Seeding default news
    const currentNews = await db.select().from(newsArticles);
    if (currentNews.length === 0) {
      await db.insert(newsArticles).values([
        {
          title: "Campagne de Salubrité urbaine",
          slug: "campagne-salubrite-urbaine",
          summary: "Grand nettoyage citoyen programmé ce samedi dans tous les arrondissements de Libreville.",
          content: "Dans le cadre de l'initiative 'Libreville Ville Propre', Monsieur le Maire invite l'ensemble de la population et les associations de quartier à se mobiliser massivement pour la grande journée citoyenne de salubrité et de nettoyage général qui aura lieu ce samedi à partir de 7h30. Des équipements (pelles, râteaux, brouettes et sacs poubelles) seront mis en place par les mairies d'arrondissements pour assister les citoyens.",
          featuredImage: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=800",
          isPublished: true,
          isFeatured: true,
        },
        {
          title: "Modernisation de l'État Civil",
          slug: "modernisation-etat-civil",
          summary: "Nouveau dispositif numérique sécurisé pour le traitement ultra-rapide de vos actes officiels.",
          content: "L'Hôtel de Ville de Libreville franchit un cap historique dans la transition numérique de ses services publics. Grâce à notre nouvelle infrastructure numérique, la soumission et le traitement des actes de naissance, dossiers de mariage et cartes nationales d'identité sont désormais dématérialisés pour offrir des délais d'attente raccourcis de 50%. Les citoyens peuvent dorénavant suivre l'avancée de leur dossier 24h/24 en toute sécurité sans quitter leur domicile.",
          featuredImage: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800",
          isPublished: true,
          isFeatured: false,
        },
        {
          title: "Aménagement de la Voie Publique",
          slug: "amenagement-voie-publique",
          summary: "Lancement des chantiers d'envergure pour la réhabilitation des axes secondaires et éclairage public LED.",
          content: "Afin de désengorger la circulation routière et sécuriser les piétons, la Mairie de Libreville entame la réhabilitation globale des voiries secondaires de la capitale. Les travaux comprennent aussi le déploiement généralisé de lampadaires à économie d'énergie LED pour moderniser l'éclairage nocturne urbain dans nos quartiers.",
          featuredImage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800",
          isPublished: true,
          isFeatured: false,
        }
      ]);
      console.log("News articles seeded.");
    }

    // Seeding active events
    const currentEvents = await db.select().from(events);
    if (currentEvents.length === 0) {
      await db.insert(events).values([
        {
          title: "Grand Nettoyage Communal",
          description: "La Mairie déploie des camions-bennes et des équipes de soutien pour assister tous les citoyens dans le nettoyage de proximité.",
          startDate: "2026-06-27",
          endDate: "2026-06-27",
          location: "Libreville : Tous les Arrondissements (1er au 6ème)",
          isActive: true
        }
      ]);
      console.log("Events seeded.");
    }

  } catch (err) {
    console.error("Error during database bootstrap / seeding:", err);
  }
}

// Fire the bootloader
ensureTablesAndSeed();

// ==========================================
// API ENDPOINTS
// ==========================================

// Authenticated current user check (synchronizes Firebase users)
app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    return res.json({ user: req.dbUser });
  } catch (error: any) {
    return res.status(500).json({ error: "Erreur serveur : auth me" });
  }
});

// Update citizen profile details
app.put("/api/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({ error: "Utilisateur non synchronisé" });
    }

    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      dateOfBirth, 
      placeOfBirth, 
      nationalIdNumber, 
      address, 
      district 
    } = req.body;

    const updated = await db.update(users)
      .set({
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        placeOfBirth,
        nationalIdNumber,
        address,
        district,
      })
      .where(eq(users.id, req.dbUser.id))
      .returning();

    return res.json({ success: true, user: updated[0] });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
  }
});

// List services
app.get("/api/services", async (req, res) => {
  try {
    const list = await db.select().from(services);
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: "Impossible de récupérer les démarches" });
  }
});

// Fetch all news
app.get("/api/news", async (req, res) => {
  try {
    const list = await db.select().from(newsArticles).where(eq(newsArticles.isPublished, true)).orderBy(desc(newsArticles.publicationDate));
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: "Impossible de récupérer les actualités" });
  }
});

// Fetch active events
app.get("/api/events", async (req, res) => {
  try {
    const list = await db.select().from(events).where(eq(events.isActive, true));
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: "Impossible de récupérer les événements" });
  }
});

// Submit generic contact / complaint message
app.post("/api/messages", async (req, res) => {
  try {
    const { subject, fullName, email, phone, message } = req.body;
    if (!subject || !fullName || !email || !message) {
      return res.status(400).json({ error: "Tous les champs requis ne sont pas remplis." });
    }

    const newMessage = await db.insert(contactMessages).values({
      subject,
      fullName,
      email,
      phone,
      message,
    }).returning();

    return res.json({ success: true, message: newMessage[0] });
  } catch (err: any) {
    return res.status(500).json({ error: "Impossible d'envoyer le message" });
  }
});

// Retrieve notifications for authenticated user
app.get("/api/notifications", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: "Non connecté" });
    
    const list = await db.select().from(notifications)
      .where(eq(notifications.userId, req.dbUser.id))
      .orderBy(desc(notifications.createdAt));
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: "Erreur de chargement des notifications" });
  }
});

// Mark notification as read
app.put("/api/notifications/:id/read", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: "Non connecté" });
    const { id } = req.params;

    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, parseInt(id)), eq(notifications.userId, req.dbUser.id)));

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: "Erreur de mise à jour" });
  }
});

// ==========================================
// TRANSACTIONS / CITIZEN APPLICATIONS ENDPOINTS
// ==========================================

// Birth declaration submission
app.post("/api/declarations/birth", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: "Inscrivez-vous d'abord" });
    const { 
      childLastName, 
      childFirstName, 
      childDateOfBirth, 
      childPlaceOfBirth, 
      fatherName, 
      motherName, 
      declarationDate, 
      documentUrl 
    } = req.body;

    if (!childLastName || !childFirstName || !childDateOfBirth || !childPlaceOfBirth || !fatherName || !motherName || !declarationDate) {
      return res.status(400).json({ error: "Veuillez remplir toutes les informations réglementaires de naissance." });
    }

    const result = await db.insert(birthDeclarations).values({
      userId: req.dbUser.id,
      childLastName,
      childFirstName,
      childDateOfBirth,
      childPlaceOfBirth,
      fatherName,
      motherName,
      declarationDate,
      documentUrl: documentUrl || "",
      status: "SUBMITTED",
    }).returning();

    // Create confirmation notification
    await db.insert(notifications).values({
      userId: req.dbUser.id,
      title: "Déclaration de naissance reçue",
      message: `Votre dossier pour l'enfant ${childFirstName} ${childLastName} a été transmis avec succès à nos agents d'état civil.`,
      notificationType: "STATUS_UPDATE",
    });

    return res.json({ success: true, dossier: result[0] });
  } catch (err: any) {
    console.error("Birth submission error:", err);
    return res.status(500).json({ error: "Erreur lors du dépôt de la déclaration" });
  }
});

// Marriage dossier submission
app.post("/api/declarations/marriage", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: "Compte requis" });
    const { 
      spouseLastName, 
      spouseFirstName, 
      spouseDateOfBirth, 
      spousePlaceOfBirth, 
      spouseNationalId, 
      weddingDate, 
      weddingLocation, 
      documentUrl 
    } = req.body;

    if (!spouseLastName || !spouseFirstName || !spouseDateOfBirth || !spousePlaceOfBirth || !spouseNationalId || !weddingDate || !weddingLocation) {
      return res.status(400).json({ error: "Informations du conjoint et du mariage requises." });
    }

    // Generate unique dossier tracking code
    const trackingCode = `MAR-${Math.floor(100000 + Math.random() * 900000)}`;

    const result = await db.insert(marriageDossiers).values({
      userId: req.dbUser.id,
      spouseLastName,
      spouseFirstName,
      spouseDateOfBirth,
      spousePlaceOfBirth,
      spouseNationalId,
      weddingDate,
      weddingLocation,
      status: "SUBMITTED",
      dossierNumber: trackingCode,
      documentUrl: documentUrl || "",
    }).returning();

    await db.insert(notifications).values({
      userId: req.dbUser.id,
      title: "Dossier de mariage transmis",
      message: `Votre demande de célébration de mariage en date du ${weddingDate} a été enregistrée de manière sécurisée sous le n° ${trackingCode}.`,
      notificationType: "STATUS_UPDATE",
    });

    return res.json({ success: true, dossier: result[0] });
  } catch (err: any) {
    return res.status(500).json({ error: "Erreur de dépôt de dossier" });
  }
});

// CNI Request
app.post("/api/declarations/id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: "Authentification requise" });
    const { idType, applicationReason, previousIdNumber, placeOfIssue, documentUrl } = req.body;

    if (!idType || !applicationReason || !placeOfIssue) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }

    const tracking = `CNI-${Math.floor(100000 + Math.random() * 900000)}`;

    const result = await db.insert(nationalIdRequests).values({
      userId: req.dbUser.id,
      idType,
      applicationReason,
      previousIdNumber: previousIdNumber || "",
      placeOfIssue,
      status: "SUBMITTED",
      requestNumber: tracking,
      documentUrl: documentUrl || "",
    }).returning();

    await db.insert(notifications).values({
      userId: req.dbUser.id,
      title: "Pré-demande d'identité soumise",
      message: `Votre démarche pour obtenir un document d'identité (${idType}) a été envoyée. Référence : ${tracking}.`,
      notificationType: "STATUS_UPDATE",
    });

    return res.json({ success: true, dossier: result[0] });
  } catch (err: any) {
    return res.status(500).json({ error: "Erreur de dépôt de CNI" });
  }
});

// Building Permit Request
app.post("/api/declarations/permit", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: "Authentification requise" });
    const { 
      permitType, 
      propertyAddress, 
      propertyParcelNumber, 
      projectDescription, 
      constructionArea, 
      estimatedCost, 
      architectName, 
      landTitleUrl, 
      plansUrl 
    } = req.body;

    if (!permitType || !propertyAddress || !propertyParcelNumber || !projectDescription || !constructionArea || !estimatedCost) {
      return res.status(400).json({ error: "Champs requis manquants pour le permis de construire." });
    }

    const trackingNum = `PC-${Math.floor(100000 + Math.random() * 900000)}`;

    const result = await db.insert(buildingPermits).values({
      userId: req.dbUser.id,
      permitType,
      propertyAddress,
      propertyParcelNumber,
      projectDescription,
      constructionArea: String(constructionArea),
      estimatedCost: String(estimatedCost),
      architectName: architectName || "",
      status: "SUBMITTED",
      permitNumber: trackingNum,
      landTitleUrl: landTitleUrl || "",
      plansUrl: plansUrl || "",
    }).returning();

    await db.insert(notifications).values({
      userId: req.dbUser.id,
      title: "Dossier d'urbanisme reçu",
      message: `Votre demande de Permis de Construire (${permitType}) a été affectée au service d'urbanisme de Libreville. N° ${trackingNum}.`,
      notificationType: "STATUS_UPDATE",
    });

    return res.json({ success: true, dossier: result[0] });
  } catch (err: any) {
    console.error("Permit submission error:", err);
    return res.status(500).json({ error: "Erreur technique de transmission" });
  }
});

// Work Authorization
app.post("/api/declarations/work", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: "Authentification requise" });
    const { 
      workType, 
      workLocation, 
      workDescription, 
      startDate, 
      endDate, 
      estimatedDuration, 
      trafficImpact, 
      securityMeasures 
    } = req.body;

    if (!workType || !workLocation || !workDescription || !startDate || !endDate || !estimatedDuration) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    const trackingNum = `AUT-${Math.floor(100000 + Math.random() * 900000)}`;

    const result = await db.insert(workAuthorizations).values({
      userId: req.dbUser.id,
      workType,
      workLocation,
      workDescription,
      startDate,
      endDate,
      estimatedDuration,
      trafficImpact: trafficImpact || "",
      securityMeasures: securityMeasures || "",
      status: "SUBMITTED",
      authorizationNumber: trackingNum,
    }).returning();

    await db.insert(notifications).values({
      userId: req.dbUser.id,
      title: "Demande d'autorisation de travaux requise",
      message: `Votre demande d'autorisation de travaux de type ${workType} portant la référence ${trackingNum} a été déposée.`,
      notificationType: "STATUS_UPDATE",
    });

    return res.json({ success: true, dossier: result[0] });
  } catch (err: any) {
    return res.status(500).json({ error: "Erreur de dépôt de travaux" });
  }
});

// Get ALL dossiers submitted by CURRENT citizen
app.get("/api/citizen/dossiers", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser) return res.status(401).json({ error: "Non connecté" });

    const births = await db.select().from(birthDeclarations).where(eq(birthDeclarations.userId, req.dbUser.id));
    const marriages = await db.select().from(marriageDossiers).where(eq(marriageDossiers.userId, req.dbUser.id));
    const ids = await db.select().from(nationalIdRequests).where(eq(nationalIdRequests.userId, req.dbUser.id));
    const permits = await db.select().from(buildingPermits).where(eq(buildingPermits.userId, req.dbUser.id));
    const works = await db.select().from(workAuthorizations).where(eq(workAuthorizations.userId, req.dbUser.id));

    // Map each to a unified tracking interface
    const unified = [
      ...births.map(b => ({ id: b.id, ref: b.registrationNumber || `BD-${b.id}`, type: "Naissance", subtype: `${b.childFirstName} ${b.childLastName}`, date: b.submittedAt, status: b.status, comments: b.comments })),
      ...marriages.map(m => ({ id: m.id, ref: m.dossierNumber || `MAR-${m.id}`, type: "Mariage", subtype: `Avec ${m.spouseFirstName} ${m.spouseLastName}`, date: m.submittedAt, status: m.status, comments: m.comments })),
      ...ids.map(i => ({ id: i.id, ref: i.requestNumber || `ID-${i.id}`, type: "Identité", subtype: `${i.idType} (${i.applicationReason})`, date: i.submittedAt, status: i.status, comments: i.comments })),
      ...permits.map(p => ({ id: p.id, ref: p.permitNumber || `PC-${p.id}`, type: "Permis de Construire", subtype: p.permitType, date: p.submittedAt, status: p.status, comments: p.comments })),
      ...works.map(w => ({ id: w.id, ref: w.authorizationNumber || `AUT-${w.id}`, type: "Travaux", subtype: w.workType, date: w.submittedAt, status: w.status, comments: w.comments })),
    ].sort((a, b) => {
      const d1 = a.date ? new Date(a.date).getTime() : 0;
      const d2 = b.date ? new Date(b.date).getTime() : 0;
      return d2 - d1;
    });

    return res.json(unified);
  } catch (err: any) {
    console.error("Citizen dossiers fetch error:", err);
    return res.status(500).json({ error: "Impossible de récupérer vos démarches" });
  }
});


// ==========================================
// CENTRALIZED SERVICE PORTAL / ADMIN AREA ENDPOINTS
// ==========================================

// Get all dossiers across all types (Agent & Admin exclusive query)
app.get("/api/admin/dossiers", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser || (req.dbUser.role !== "admin" && req.dbUser.role !== "agent")) {
      return res.status(403).json({ error: "Réservé aux agents municipaux" });
    }

    const births = await db.select({
      dossier: birthDeclarations,
      email: users.email,
    })
    .from(birthDeclarations)
    .innerJoin(users, eq(birthDeclarations.userId, users.id));

    const marriages = await db.select({
      dossier: marriageDossiers,
      email: users.email,
    })
    .from(marriageDossiers)
    .innerJoin(users, eq(marriageDossiers.userId, users.id));

    const ids = await db.select({
      dossier: nationalIdRequests,
      email: users.email,
    })
    .from(nationalIdRequests)
    .innerJoin(users, eq(nationalIdRequests.userId, users.id));

    const permits = await db.select({
      dossier: buildingPermits,
      email: users.email,
    })
    .from(buildingPermits)
    .innerJoin(users, eq(buildingPermits.userId, users.id));

    const works = await db.select({
      dossier: workAuthorizations,
      email: users.email,
    })
    .from(workAuthorizations)
    .innerJoin(users, eq(workAuthorizations.userId, users.id));

    // Combine them with parent types
    const consolidated = [
      ...births.map(b => ({ id: b.dossier.id, type: "birth", typeLabel: "Naissance", citizenEmail: b.email, ref: b.dossier.registrationNumber || `BD-${b.dossier.id}`, status: b.dossier.status, details: `${b.dossier.childFirstName} ${b.dossier.childLastName}, né(e) le ${b.dossier.childDateOfBirth}`, date: b.dossier.submittedAt, comments: b.dossier.comments, userId: b.dossier.userId })),
      ...marriages.map(m => ({ id: m.dossier.id, type: "marriage", typeLabel: "Mariage", citizenEmail: m.email, ref: m.dossier.dossierNumber || `MAR-${m.dossier.id}`, status: m.dossier.status, details: `Conjoint: ${m.dossier.spouseFirstName} ${m.dossier.spouseLastName}, Date: ${m.dossier.weddingDate}`, date: m.dossier.submittedAt, comments: m.dossier.comments, userId: m.dossier.userId })),
      ...ids.map(i => ({ id: i.dossier.id, type: "id", typeLabel: "Identité", citizenEmail: i.email, ref: i.dossier.requestNumber || `ID-${i.dossier.id}`, status: i.dossier.status, details: `${i.dossier.idType} (${i.dossier.applicationReason})`, date: i.dossier.submittedAt, comments: i.dossier.comments, userId: i.dossier.userId })),
      ...permits.map(p => ({ id: p.dossier.id, type: "permit", typeLabel: "Permis de Construire", citizenEmail: p.email, ref: p.dossier.permitNumber || `PC-${p.dossier.id}`, status: p.dossier.status, details: `${p.dossier.permitType} à ${p.dossier.propertyAddress}`, date: p.dossier.submittedAt, comments: p.dossier.comments, userId: p.dossier.userId })),
      ...works.map(w => ({ id: w.dossier.id, type: "work", typeLabel: "Autorisation Travaux", citizenEmail: w.email, ref: w.dossier.authorizationNumber || `AUT-${w.dossier.id}`, status: w.dossier.status, details: `${w.dossier.workType} : ${w.dossier.workDescription}`, date: w.dossier.submittedAt, comments: w.dossier.comments, userId: w.dossier.userId })),
    ].sort((a,b) => {
      const d1 = a.date ? new Date(a.date).getTime() : 0;
      const d2 = b.date ? new Date(b.date).getTime() : 0;
      return d2 - d1;
    });

    return res.json(consolidated);
  } catch (err: any) {
    console.error("Error loaded all dossiers for staff:", err);
    return res.status(500).json({ error: "Erreur lors du chargement général des dossiers." });
  }
});

// Update specific dossier status & comments (Staff Actions)
app.put("/api/admin/dossiers/:type/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser || (req.dbUser.role !== "admin" && req.dbUser.role !== "agent")) {
      return res.status(403).json({ error: "Privilèges insuffisants" });
    }

    const { type, id } = req.params;
    const { status, comments, registrationNumber, userId } = req.body;

    // Based on the dossier type, run database update
    const numericId = parseInt(id);
    let refNum = registrationNumber;

    if (type === "birth") {
      if (status === "APPROVED" && !refNum) {
        refNum = `REG-${Math.floor(1000 + Math.random() * 9000)}-NAI`;
      }
      await db.update(birthDeclarations)
        .set({ status, comments, registrationNumber: refNum, processedAt: new Date() })
        .where(eq(birthDeclarations.id, numericId));
    } else if (type === "marriage") {
      await db.update(marriageDossiers)
        .set({ status, comments, processedAt: new Date() })
        .where(eq(marriageDossiers.id, numericId));
    } else if (type === "id") {
      await db.update(nationalIdRequests)
        .set({ status, comments, processedAt: new Date() })
        .where(eq(nationalIdRequests.id, numericId));
    } else if (type === "permit") {
      await db.update(buildingPermits)
        .set({ status, comments, processedAt: new Date() })
        .where(eq(buildingPermits.id, numericId));
    } else if (type === "work") {
      await db.update(workAuthorizations)
        .set({ status, comments, processedAt: new Date() })
        .where(eq(workAuthorizations.id, numericId));
    } else {
      return res.status(400).json({ error: "Type de dossier inconnu." });
    }

    // Trigger notification to the associated citizen
    if (userId) {
      await db.insert(notifications).values({
        userId: parseInt(userId),
        title: "Dossier mis à jour",
        message: `Le statut de votre dossier de ${type === "birth" ? "Naissance" : type === "marriage" ? "Mariage" : type === "id" ? "CNI/Passeport" : type === "permit" ? "Permis Construire" : "Travaux"} a changé pour : "${status}".`,
        notificationType: "STATUS_UPDATE",
      });
    }

    return res.json({ success: true, trackingNumber: refNum });
  } catch (err: any) {
    console.error("Dossier update error:", err);
    return res.status(500).json({ error: "Impossible de modifier le dossier" });
  }
});

// Admin list users
app.get("/api/admin/users", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser || req.dbUser.role !== "admin") {
      return res.status(403).json({ error: "Seul un Administrateur Général est habilité." });
    }
    const list = await db.select().from(users).orderBy(desc(users.id));
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: "Erreur de chargement" });
  }
});

// Admin update user role
app.put("/api/admin/users/:id/role", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser || req.dbUser.role !== "admin") {
      return res.status(403).json({ error: "Seul l'administration peut assigner des rôles." });
    }
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "agent", "citoyen"].includes(role)) {
      return res.status(400).json({ error: "Rôle invalide" });
    }

    await db.update(users).set({ role }).where(eq(users.id, parseInt(id)));
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: "Erreur d'assignation" });
  }
});

// Admin list messages
app.get("/api/admin/messages", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser || (req.dbUser.role !== "admin" && req.dbUser.role !== "agent")) {
      return res.status(403).json({ error: "Accès staff uniquement" });
    }
    const list = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: "Erreur" });
  }
});

// Admin reply / process contact message
app.put("/api/admin/messages/:id/reply", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.dbUser || (req.dbUser.role !== "admin" && req.dbUser.role !== "agent")) {
      return res.status(403).json({ error: "Accès staff uniquement" });
    }
    const { id } = req.params;
    const { response } = req.body;

    await db.update(contactMessages)
      .set({ isProcessed: true, response })
      .where(eq(contactMessages.id, parseInt(id)));

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: "Erreur de mise à jour" });
  }
});

// Vite middleware setup for assets in dev or production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mairie de Libreville Portal running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
