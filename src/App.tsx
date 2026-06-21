import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { HeaderNav } from "./components/HeaderNav";
import { MainPortal } from "./components/MainPortal";
import { CitizenDashboard } from "./components/CitizenDashboard";
import { AgentPanel } from "./components/AgentPanel";
import { DemarcheForm } from "./components/DemarcheForm";
import { 
  Building2, 
  Clock, 
  FileText, 
  CheckCircle, 
  MapPin, 
  Phone, 
  Search, 
  ArrowRight,
  LogIn,
  AlertTriangle,
  FolderOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MairieService, NewsArticle, MairieEvent, Notification } from "./types";
import { formatCFA } from "./utils/format";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

function AppContent() {
  const { user, dbUser, loading, loginWithGoogle, logout, fetchWithAuth } = useAuth();
  const [currentTab, setCurrentTab] = useState("accueil");
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Local backend lists
  const [services, setServices] = useState<MairieService[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<MairieEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Selection states
  const [selectedServiceSlug, setSelectedServiceSlug] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Search filter for services view
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceCategory, setServiceCategory] = useState("ALL");

  // Toast notifier helper
  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Synchronize municipal portal components on boot
  const loadPortalData = async () => {
    setLoadingData(true);
    try {
      // Unauthenticated friendly endpoints
      const [servicesRes, newsRes, eventsRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/news"),
        fetch("/api/events")
      ]);

      if (servicesRes.ok) setServices(await servicesRes.json());
      if (newsRes.ok) setNews(await newsRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());

      // Authenticated notifications if user is present
      if (user) {
        const notifRes = await fetchWithAuth("/api/notifications");
        if (notifRes.ok) {
          setNotifications(await notifRes.json());
        }
      }
    } catch (err) {
      console.warn("Échec du chargement des caches municipaux.", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [user]);

  // If role is changed, route citizens appropriately
  useEffect(() => {
    if (dbUser) {
      if (dbUser.role === "admin" || dbUser.role === "agent") {
        setCurrentTab("agent");
      } else {
        setCurrentTab("accueil");
      }
    } else {
      setCurrentTab("accueil");
    }
  }, [dbUser]);

  // Loading state of the Firebase Auth session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Démarrage des guichets numériques de Libreville...</p>
        </div>
      </div>
    );
  }

  // Active checkouts / selected service info
  const activeServiceObj = services.find((s) => s.slug === selectedServiceSlug);

  // Filter services list
  const filteredServices = services.filter((s) => {
    const catMatch = serviceCategory === "ALL" || s.categorySlug === serviceCategory;
    const query = serviceSearch.toLowerCase();
    const textMatch = !serviceSearch || 
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query);
    return catMatch && textMatch;
  });

  const handleStartServiceProcess = (slug: string) => {
    if (!user) {
      addToast("Veuillez vous authentifier sur votre Espace Citoyen pour soumettre un acte légal.", "info");
      loginWithGoogle();
      return;
    }
    setSelectedServiceSlug(slug);
    setCurrentTab("checkout-service");
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all duration-200 ${darkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* 1. TOP HEADER CONTROL HEADER */}
      <HeaderNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        dbUser={dbUser}
        notifications={notifications}
        onLogin={loginWithGoogle}
        onLogout={logout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* 2. BODY CHASSIS CONTAINER */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            
            {/* TAB A: ACCUEIL */}
            {currentTab === "accueil" && (
              <MainPortal
                services={services}
                news={news}
                events={events}
                setCurrentTab={setCurrentTab}
                setSelectedServiceSlug={setSelectedServiceSlug}
                onLogin={loginWithGoogle}
                addToast={addToast}
              />
            )}

            {/* TAB B: DÉMARCHES LIST COMPONENT */}
            {currentTab === "demarches" && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Démarches Administratives Dématérialisées</h2>
                    <p className="text-slate-505 dark:text-slate-400 text-xs mt-1">Sélectionnez et initiez votre formalité d'état civil, d'identité nationale ou d'urbanisme foncier.</p>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setServiceCategory("ALL")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${serviceCategory === "ALL" ? "bg-slate-900 dark:bg-emerald-600 border-slate-900 text-white" : "border-slate-200 dark:border-slate-800 text-slate-655"}`}
                    >
                      Toutes
                    </button>
                    <button 
                      onClick={() => setServiceCategory("etat-civil")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${serviceCategory === "etat-civil" ? "bg-slate-900 dark:bg-emerald-600 border-slate-900 text-white" : "border-slate-200 dark:border-slate-800 text-slate-655"}`}
                    >
                      État Civil
                    </button>
                    <button 
                      onClick={() => setServiceCategory("urbanisme")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${serviceCategory === "urbanisme" ? "bg-slate-900 dark:bg-emerald-600 border-slate-900 text-white" : "border-slate-205 dark:border-slate-800 text-slate-655"}`}
                    >
                      Urbanisme
                    </button>
                  </div>
                </div>

                {/* Filter and search bar */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer un service (ex: Naissance, Permis)..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((s) => (
                    <div key={s.slug} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[250px]">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider font-bold ${s.categorySlug === "etat-civil" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"}`}>
                            {s.categorySlug === "etat-civil" ? "État Civil" : "Urbanisme"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">Timbre: {formatCFA(s.feeAmount)}</span>
                        </div>
                        <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white mt-3 block">{s.name}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 line-clamp-3 leading-snug">{s.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/80 pt-3">
                        <span className="text-[9px] text-slate-400 inline-flex items-center space-x-1">
                          <Clock className="h-3 w-3" /> <span>{s.estimatedTime}</span>
                        </span>
                        <button
                          onClick={() => handleStartServiceProcess(s.slug)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <span>Initier</span> <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB C: ACTUALITÉS LIST */}
            {currentTab === "actualites" && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Actualités & Projets Communaux</h2>
                  <p className="text-slate-505 dark:text-slate-400 text-xs mt-1">Restez informés sur les événements, arrêtés municipaux et l'évolution des infrastructures publiques à Libreville.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {news.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                      <div className="h-48 bg-slate-100 relative overflow-hidden">
                        {item.featuredImage ? (
                          <img src={item.featuredImage} referrerPolicy="no-referrer" alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-350 bg-slate-800">
                            <Building2 className="h-10 w-10 text-slate-500" />
                          </div>
                        )}
                        {item.isFeatured && (
                          <span className="absolute top-4 left-4 bg-red-600 text-white text-[9px] font-mono tracking-wider font-bold px-2 py-0.5 rounded uppercase">
                            À la Une
                          </span>
                        )}
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-emerald-650 dark:text-emerald-400 font-semibold block">
                            Date de parution : {new Date(item.publicationDate).toLocaleDateString("fr-FR")}
                          </span>
                          <h4 className="font-display font-bold text-base text-slate-950 dark:text-white leading-snug">{item.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-355 leading-relaxed font-light">{item.content}</p>
                        </div>
                        <div className="border-t border-slate-50 dark:border-slate-850 pt-3 flex justify-between items-center text-xs text-slate-405">
                          <span>Consultations : {item.viewCount} citoyens</span>
                          <span className="text-emerald-500 font-semibold font-mono tracking-wider uppercase text-[10px]">Libreville Libre</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB D: CONTACTS CORNER FORM */}
            {currentTab === "contact" && (
              <div className="space-y-6 text-left max-w-4xl mx-auto">
                <div className="border-b border-slate-100 dark:border-slate-805 pb-4">
                  <h2 className="font-display font-bold text-2xl text-slate-905 dark:text-white">Formulaire de Proximité Citoyenne</h2>
                  <p className="text-slate-505 dark:text-slate-400 text-xs mt-1">L'Hôtel de Ville s'engage à vous répondre sous 48 heures ouvrables.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 p-6 rounded-2xl shadow-sm text-left font-light space-y-4">
                  <p>Pour toute réclamation, incident sur la voirie, raccordement défectueux d'infrastructure ou demande d'évaluation réglementaire d'acte d'état civil, veuillez rédiger votre message ci-dessous.</p>
                  <button
                    onClick={() => {
                      const el = document.getElementById("contact-panel");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                      else {
                        setCurrentTab("accueil");
                        setTimeout(() => document.getElementById("contact-panel")?.scrollIntoView({ behavior: "smooth" }), 200);
                      }
                    }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-805 dark:bg-emerald-600 text-white rounded-lg text-xs font-bold pointer-events-auto cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Faire un message</span> <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB E: FORM STEP FOR DEMARCHES CHECKOUT WIZARD */}
            {currentTab === "checkout-service" && activeServiceObj && dbUser && (
              <DemarcheForm
                service={activeServiceObj}
                dbUser={dbUser}
                fetchWithAuth={fetchWithAuth}
                setCurrentTab={setCurrentTab}
                addToast={addToast}
              />
            )}

            {/* TAB F: CITIZEN AREA / MON ESPACE */}
            {currentTab === "dashboard" && dbUser && (
              <CitizenDashboard
                dbUser={dbUser}
                fetchWithAuth={fetchWithAuth}
                notifications={notifications}
                onProfileUpdated={loadPortalData}
                addToast={addToast}
              />
            )}

            {/* TAB G: AGENT CORNER DESK */}
            {currentTab === "agent" && dbUser && (dbUser.role === "admin" || dbUser.role === "agent") && (
              <AgentPanel
                currentUserEmail={dbUser.email}
                fetchWithAuth={fetchWithAuth}
                addToast={addToast}
              />
            )}

          </motion.div>
        </AnimatePresence>

      </main>

      {/* 3. FLOATING ANIMATED TOASTER LIST */}
      <div className="fixed bottom-5 right-5 z-55 space-y-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="pointer-events-auto w-full"
            >
              <div className={`flex items-start p-4 rounded-xl shadow-2xl border ${
                t.type === "success" 
                  ? "bg-slate-900 text-white border-emerald-500/30" 
                  : t.type === "error" 
                  ? "bg-red-950 text-red-200 border-red-900/30" 
                  : "bg-slate-850 text-white border-indigo-900/40"
              }`}>
                {t.type === "success" ? (
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5 mr-2.5" />
                ) : (
                  <AlertTriangle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5 mr-2.5" />
                )}
                
                <div className="flex-1 text-xs font-semibold leading-relaxed">
                  {t.message}
                </div>

                <button 
                  onClick={() => removeToast(t.id)} 
                  className="text-slate-400 hover:text-white shrink-0 font-bold text-xs ml-3 bg-slate-800 hover:bg-slate-700/60 transition-all rounded-full h-5 w-5 flex items-center justify-center p-0"
                >
                  &times;
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 4. MUNICIPAL FOOTER */}
      <footer className="w-full bg-slate-900 text-slate-400 pt-10 pb-6 border-t border-slate-800 px-4 mt-auto font-light leading-relaxed">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-8">
          <div className="space-y-3">
            <span className="font-display font-medium text-white block">Mairie de la Commune de Libreville</span>
            <p className="text-xs">Portail dématérialisé d'accès souverain aux guichets administratifs d'état civil, d'urbanisme régional et de sécurité locale pour tous les citoyens de la capitale.</p>
          </div>
          <div className="space-y-3 font-light text-xs">
            <span className="font-display font-medium text-white block">Ressources & Arrêtés</span>
            <ul className="space-y-2">
              <li className="hover:text-emerald-400 transition-colors pointer-events-auto cursor-pointer" onClick={() => setCurrentTab("demarches")}>Grille des tarifs des timbres fiscaux</li>
              <li className="hover:text-emerald-400 transition-colors pointer-events-auto cursor-pointer" onClick={() => setCurrentTab("actualites")}>Derniers Bulletins Municipaux</li>
              <li className="hover:text-emerald-400 transition-colors pointer-events-auto cursor-pointer" onClick={() => setCurrentTab("contact")}>Assistance technique & Accessibilité</li>
            </ul>
          </div>
          <div className="space-y-3 text-xs">
            <span className="font-display font-medium text-white block">Capitale d'Afrique Centrale</span>
            <p className="leading-relaxed">
              Place de l'Indépendance, B.P. 51 Libreville, République Gabonaise.<br />
              Permanence d'État Civil le samedi matin.<br />
              Téléphone : 1300 / 1722.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-805/80 pt-6 text-center text-xs text-slate-550 flex flex-col sm:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
          <span>&copy; {new Date().getFullYear()} Mairie de Libreville - République Gabonaise. Tous droits réservés.</span>
          <span className="text-[10px] font-mono font-semibold uppercase text-emerald-400">Union - Travail - Justice</span>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
