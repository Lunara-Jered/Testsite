import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User 
} from "firebase/auth";
import { auth, googleAuthProvider } from "../lib/firebase.ts";

interface AuthContextType {
  user: User | null;
  dbUser: { id: number; uid: string; email: string; role: string } | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<AuthContextType["dbUser"]>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Authenticated fetch helper
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    let currentToken = token;
    
    // Si pas de token actif mais un utilisateur connecté, on récupère le token
    if (!currentToken && auth.currentUser) {
      currentToken = await auth.currentUser.getIdToken(true);
      setToken(currentToken);
    }

    const headers = {
      ...(options.headers || {}),
      "Content-Type": "application/json",
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };

    return fetch(url, { ...options, headers });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const idToken = await firebaseUser.getIdToken(true);
          setToken(idToken);

          // Synchroniser avec notre serveur
          const res = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            }
          });

          if (res.ok) {
            const data = await res.json();
            setDbUser(data.user);
          } else {
            console.error("Erreur de synchronisation avec le backend.");
          }
        } catch (error) {
          console.error("Erreur de récupération du token :", error);
        }
      } else {
        setUser(null);
        setDbUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      console.error("Erreur de connexion Google :", err);
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setDbUser(null);
      setToken(null);
    } catch (err) {
      console.error("Erreur lors de la déconnexion :", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        token,
        loading,
        loginWithGoogle,
        logout,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé au sein d'un AuthProvider");
  }
  return context;
};
