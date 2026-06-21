import React, { useState, useEffect } from "react";
import { 
  User, 
  Settings, 
  Bell, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Calendar, 
  CreditCard, 
  RefreshCw,
  Printer
} from "lucide-react";
import { CitizenUser, UnifiedDossier, Notification } from "../types";
import { getStatusTheme, formatDate } from "../utils";

interface CitizenDashboardProps {
  dbUser: CitizenUser;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  notifications: Notification[];
  onProfileUpdated: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  dbUser,
  fetchWithAuth,
  notifications,
  onProfileUpdated,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<"dossiers" | "profile" | "notifs">("dossiers");
  
  // Profile Form States
  const [firstName, setFirstName] = useState(dbUser.firstName || "");
  const [lastName, setLastName] = useState(dbUser.lastName || "");
  const [phone, setPhone] = useState(dbUser.phoneNumber || "");
  const [birthDate, setBirthDate] = useState(dbUser.dateOfBirth || "");
  const [birthPlace, setBirthPlace] = useState(dbUser.placeOfBirth || "");
  const [idNum, setIdNum] = useState(dbUser.nationalIdNumber || "");
  const [address, setAddress] = useState(dbUser.address || "");
  const [district, setDistrict] = useState(dbUser.district || "1er Arrondissement");
  const [savingProfile, setSavingProfile] = useState(false);

  // User submissions/dossiers
  const [dossiers, setDossiers] = useState<UnifiedDossier[]>([]);
  const [loadingDossiers, setLoadingDossiers] = useState(true);
  
  // Selected dossier for printed receipt pop-up
  const [selectedDossier, setSelectedDossier] = useState<UnifiedDossier | null>(null);

  const districts = [
    "1er Arrondissement (Haut-de-Guégué, Batterie IV)",
    "2ème Arrondissement (Nkembo, Sotéga)",
    "3ème Arrondissement (Mont-Bouët, Kinguélé)",
    "4ème Arrondissement (Akébé, Plaine Niger)",
    "5ème Arrondissement (Lalala, Glass)",
    "6ème Arrondissement (Nzeng-Ayong, Dragages)"
  ];

  const fetchDossiers = async () => {
    setLoadingDossiers(true);
    try {
      const res = await fetchWithAuth("/api/citizen/dossiers");
      if (res.ok) {
        const data = await res.json();
        setDossiers(data);
      } else {
        addToast("Impossible d'extraire la liste de vos dossiers.", "error");
      }
    } catch (err) {
      addToast("Erreur lors de la synchronisation de vos démarches.", "error");
    } finally {
      setLoadingDossiers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dossiers") {
      fetchDossiers();
    }
  }, [activeTab]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await fetchWithAuth("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber: phone,
          dateOfBirth: birthDate,
          placeOfBirth: birthPlace,
          nationalIdNumber: idNum,
          address,
          district
        })
      });

      if (res.ok) {
        addToast("Vos coordonnées d'état civil ont été mises à jour.", "success");
        onProfileUpdated();
      } else {
        addToast("Une erreur s'est produite lors de la sauvegarde.", "error");
      }
    } catch (err) {
      addToast("Échec de connexion réseau.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleMarkAsRead = async (notifId: number) => {
    try {
      const res = await fetchWithAuth(`/api/notifications/${notifId}/read`, {
        method: "PUT"
      });
      if (res.ok) {
        onProfileUpdated(); // Reloads notifications count & details in parent React tree
      }
    } catch (error) {
      console.error(error);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CORNER CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Espace Citoyen : {firstName ? `${firstName} ${lastName}` : dbUser.email}
            </h2>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[10px] font-mono tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded uppercase">
                Citoyen Français de Libreville
              </span>
              {dbUser.isVerified ? (
                <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <CheckCircle className="h-2.5 w-2.5" /> <span>Profil Vérifié</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Clock className="h-2.5 w-2.5" /> <span>Vérification d'identité en cours</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Localized quick links */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("dossiers")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === "dossiers" ? "bg-slate-900 dark:bg-emerald-600 text-white" : "text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            Suivi Démarches
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === "profile" ? "bg-slate-900 dark:bg-emerald-600 text-white" : "text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            Fiche État Civil
          </button>
          <button
            onClick={() => setActiveTab("notifs")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer relative ${activeTab === "notifs" ? "bg-slate-900 dark:bg-emerald-600 text-white" : "text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            <span>Alertes</span>
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB VIEW */}
      <div className="grid grid-cols-1 gap-6 text-left">
        
        {/* VIEW 1: TRACKING ELECTRONIC DOSSIERS */}
        {activeTab === "dossiers" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white text-left">Vos Dossiers Administratifs</h3>
                <p className="text-xs text-slate-500 mt-1">Examinez le statut officiel, l'avancement et téléchargez les reçus officiels d'état civil.</p>
              </div>
              <button 
                onClick={fetchDossiers} 
                disabled={loadingDossiers} 
                className="p-2 text-slate-500 hover:text-emerald-500 rounded-lg hover:bg-slate-55 transition-colors cursor-pointer"
                title="Actualiser la liste"
              >
                <RefreshCw className={`h-4 w-4 ${loadingDossiers ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingDossiers ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
                <span className="text-xs font-mono">Chargement des dossiers d'urbanisme et d'état civil...</span>
              </div>
            ) : dossiers.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-205 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                <FileText className="h-10 w-10 text-slate-300 dark:text-slate-650 mx-auto mb-3" />
                <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white mb-1">Aucune démarche active</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">Vous n'avez pas encore soumis de déclaration d'acte civil ou de permis d'urbanisme sur ce portail municipal.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dossiers.map((d) => {
                    const theme = getStatusTheme(d.status);
                    return (
                      <div key={d.ref} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:border-slate-200 dark:hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">N° Suivi : {d.ref}</span>
                            <h4 className="font-display font-medium text-slate-900 dark:text-white text-sm">{d.typeLabel}</h4>
                            <p className="text-xs text-slate-500 mt-1 font-light leading-snug">{d.details}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
                            {theme.label}
                          </span>
                        </div>

                        {/* Comments section if revised by municipal officers */}
                        {d.comments && (
                          <div className="p-3 bg-red-400/5 border border-red-500/10 rounded-xl">
                            <span className="text-[9px] font-mono uppercase font-bold text-[#d97706] block">Notes du service d'instruction :</span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic mt-0.5 font-light leading-snug">"{d.comments}"</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                          <span className="text-[9px] font-mono text-slate-400">Dépôt : {d.date ? formatDate(d.date) : "N/A"}</span>
                          <button
                            onClick={() => setSelectedDossier(d)}
                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center space-x-1"
                          >
                            <span>Générer un reçu d'enregistrement</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: STATE OF THE CITIZEN CIVIL PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-101 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Fiche d'État Civil du Citoyen</h3>
              <p className="text-xs text-slate-500 mt-1">Ces données rattachées à votre espace sécurisé pré-rempliront automatiquement tous vos formulaires dématérialisés.</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Jean-Marie"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nom de famille *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: Nguema"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Téléphone de contact *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 077 22 33 44"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date de Naissance</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lieu de Naissance</label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Ex: Maternité CHU de Libreville"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Numéro de CNI ou Passeport</label>
                  <input
                    type="text"
                    value={idNum}
                    onChange={(e) => setIdNum(e.target.value)}
                    placeholder="Ex: 109312389"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Arrondissement de résidence *</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  >
                    {districts.map((item) => (
                      <option key={item} value={item.split(" (")[0]}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Adresse de résidence complète *</label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Nzeng-Ayong, face au complexe scolaire privé, Libreville"
                  className="w-full px-4 py-2.5 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 leading-normal font-light"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 bg-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                {savingProfile ? "Profil en cours d'enregistrement..." : "Enregistrer la Fiche d'État Civil"}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: NOTIFICATIONS LOGS TAB */}
        {activeTab === "notifs" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-101 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Fils de suivis et d'alertes
            </h3>

            {notifications.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-550">
                Vous n'avez aucun message ni suivi de dossier actif dans votre journal d'alertes.
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800/80">
                {notifications.map((n) => (
                  <div key={n.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`block h-2 w-2 rounded-full ${n.isRead ? "bg-slate-300 dark:bg-slate-700" : "bg-emerald-500 animate-pulse"}`}></span>
                        <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{n.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-550 dark:text-slate-405 leading-relaxed font-light">{n.message}</p>
                      <span className="text-[9px] font-mono text-slate-400 block">{new Date(n.createdAt).toLocaleDateString("fr-FR")} à {new Date(n.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 rounded font-semibold text-slate-655 dark:text-slate-305 transition-colors"
                      >
                        Lu
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* POP-UP ON SCREEN RECEIPT DISPLAY (CLASS PRINT COMPONENT) */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 overflow-y-auto p-4 flex items-center justify-center font-sans">
          
          <div className="bg-white text-slate-900 max-w-md w-full rounded-2xl shadow-2xl p-8 space-y-6 border border-slate-100 text-left relative print:p-0 print:border-none print:shadow-none print:max-w-full">
            
            {/* Header Gabon coat details */}
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">République Gabonaise</span>
              <h2 className="font-display font-sans font-bold text-sm tracking-tight text-slate-900">Mairie de Libreville</h2>
              <p className="text-[9px] uppercase font-mono text-[#d97706]">Département Administratif de Proximité</p>
              <div className="w-16 h-1 bg-emerald-600 mx-auto mt-2"></div>
            </div>

            <div className="border-t border-b border-dashed border-slate-200 py-4 text-center">
              <h3 className="font-display font-bold text-xs uppercase tracking-wide text-slate-950">RÉCÉPISSÉ D'ENREGISTREMENT EN LIGNE</h3>
              <p className="font-mono text-xs text-emerald-600 font-bold mt-1">N° de Dossier : {selectedDossier.ref}</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-light">Type de démarche :</span>
                <span className="font-bold">{selectedDossier.typeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-light">Détails de l'acte :</span>
                <span className="font-medium text-right max-w-[240px] truncate">{selectedDossier.details}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-light">Soumis par :</span>
                <span className="font-mono">{dbUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-light font-mono">Date de soumission :</span>
                <span className="font-mono">{selectedDossier.date ? formatDate(selectedDossier.date) : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-light">Statut actuel :</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-800">
                  {getStatusTheme(selectedDossier.status).label}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-[11px] text-slate-500 font-light leading-snug space-y-1">
              <p className="font-bold text-slate-800">Instruction réglementaire :</p>
              <p>Ce document certifie le dépôt numérique réglementaire de votre dossier à la Mairie de Libreville. Un agent municipal validera vos pièces jointes physiques ou certifiées sous les meilleurs délais.</p>
            </div>

            {/* Printing button footer */}
            <div className="flex gap-3 print:hidden">
              <button
                onClick={printReceipt}
                className="flex-1 py-2.5 bg-slate-900 border border-slate-900 text-white rounded-lg text-xs font-bold pointer-events-auto cursor-pointer hover:bg-slate-800 flex items-center justify-center space-x-2"
              >
                <Printer className="h-4.5 w-4.5" />
                <span>Imprimer / Exporter PDF</span>
              </button>
              <button
                onClick={() => setSelectedDossier(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold pointer-events-auto cursor-pointer text-center"
              >
                Fermer
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
