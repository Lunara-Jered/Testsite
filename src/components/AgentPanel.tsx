import React, { useState, useEffect } from "react";
import { 
  Building2, 
  FileCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Users, 
  Mail, 
  MessageSquare, 
  Check, 
  User, 
  ShieldCheck,
  ClipboardList,
  AlertCircle
} from "lucide-react";
import { CitizenUser, UnifiedDossier, ContactMessage } from "../types";
import { getStatusTheme, formatDate } from "../utils";

interface AgentPanelProps {
  currentUserEmail: string;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  currentUserEmail,
  fetchWithAuth,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<"dossiers" | "messages" | "users">("dossiers");
  
  // Data State Arrays
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [usersList, setUsersList] = useState<CitizenUser[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Filter States
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Target dossier selected for change action
  const [selectedDossier, setSelectedDossier] = useState<any | null>(null);
  const [actionComments, setActionComments] = useState("");
  const [actionStatus, setActionStatus] = useState("PROCESSING");

  // Selected message for claim response action
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);
  const [msgResponse, setMsgResponse] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      // Parallelize fetches of municipal documents, comments, and registrants
      const [dossiersRes, messagesRes, usersRes] = await Promise.all([
        fetchWithAuth("/api/admin/dossiers"),
        fetchWithAuth("/api/admin/messages"),
        fetchWithAuth("/api/admin/users")
      ]);

      if (dossiersRes.ok) setDossiers(await dossiersRes.json());
      if (messagesRes.ok) setMessages(await messagesRes.json());
      if (usersRes.ok) setUsersList(await usersRes.json());
    } catch (err) {
      addToast("Erreur lors de la synchronisation des données de l'Hôtel de Ville.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;

    try {
      const res = await fetchWithAuth(`/api/admin/dossiers/${selectedDossier.type}/${selectedDossier.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: actionStatus,
          comments: actionComments,
          userId: selectedDossier.userId
        })
      });

      if (res.ok) {
        addToast(`Le dossier de ${selectedDossier.citizenEmail} est passé en statut : "${actionStatus}".`, "success");
        setSelectedDossier(null);
        setActionComments("");
        loadData();
      } else {
        addToast("Impossible d'altérer le dossier administratif.", "error");
      }
    } catch (err) {
      addToast("Erreur d'altération réseau.", "error");
    }
  };

  const handleMessageReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMsg) return;

    try {
      const res = await fetchWithAuth(`/api/admin/messages/${selectedMsg.id}/reply`, {
        method: "PUT",
        body: JSON.stringify({ response: msgResponse })
      });

      if (res.ok) {
        addToast("Votre réponse d'agent a été transmise avec succès au citoyen par email.", "success");
        setSelectedMsg(null);
        setMsgResponse("");
        loadData();
      } else {
        addToast("Impossible d'enregistrer la réponse.", "error");
      }
    } catch (err) {
      addToast("Erreur réseau.", "error");
    }
  };

  const handleRoleChange = async (userId: number, newRole: "admin" | "agent" | "citoyen") => {
    try {
      const res = await fetchWithAuth(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        addToast(`Attribution du rôle "${newRole}" effectuée avec succès.`, "success");
        loadData();
      } else {
        addToast("Vous devez être Administrateur Général pour modifier les rôles.", "error");
      }
    } catch (err) {
      addToast("Changement de rôle échoué.", "error");
    }
  };

  // Stats Counters
  const countSubmitted = dossiers.filter((d) => d.status === "SUBMITTED").length;
  const countProcessing = dossiers.filter((d) => d.status === "PROCESSING" || d.status === "UNDER_REVIEW").length;
  const countApproved = dossiers.filter((d) => ["APPROVED", "COMPLETED", "AUTHORIZED", "READY", "DELIVERED", "CELEBRATED"].includes(d.status)).length;

  // Filter dossiers
  const filteredDossiers = dossiers.filter((d) => {
    const statusMatch = statusFilter === "ALL" || 
      (statusFilter === "SUBMITTED" && d.status === "SUBMITTED") ||
      (statusFilter === "PROCESSING" && (d.status === "PROCESSING" || d.status === "UNDER_REVIEW")) ||
      (statusFilter === "APPROVED" && ["APPROVED", "COMPLETED", "CELEBRATED", "READY", "DELIVERED", "AUTHORIZED"].includes(d.status)) ||
      (statusFilter === "REJECTED" && (d.status === "REJECTED" || d.status === "REFUSED"));

    const typeMatch = typeFilter === "ALL" || d.type === typeFilter;

    const query = searchQuery.toLowerCase();
    const txtMatch = !searchQuery || 
      d.ref.toLowerCase().includes(query) ||
      (d.citizenEmail && d.citizenEmail.toLowerCase().includes(query)) ||
      d.details.toLowerCase().includes(query);

    return statusMatch && typeMatch && txtMatch;
  });

  return (
    <div className="space-y-6">
      
      {/* STATS HIGHLIGHT COUNTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-left flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">Total dossiers</span>
            <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white mt-1">{dossiers.length}</h3>
          </div>
          <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-left flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-blue-500">Demandes Neuves</span>
            <h3 className="font-display font-bold text-2xl text-blue-600 dark:text-blue-400 mt-1">{countSubmitted}</h3>
          </div>
          <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-center text-blue-500">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-101 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-left flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-amber-500">En Instruction</span>
            <h3 className="font-display font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">{countProcessing}</h3>
          </div>
          <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/20 rounded-lg flex items-center justify-center text-amber-500">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-101 dark:border-slate-800 p-5 rounded-2xl shadow-sm text-left flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-emerald-500">Actes Délivrés</span>
            <h3 className="font-display font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">{countApproved}</h3>
          </div>
          <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-center justify-center text-emerald-500">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* CORE BOARD WORKSPACE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Navigation Tab links */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3 justify-between items-center flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("dossiers")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${activeTab === "dossiers" ? "bg-slate-900 dark:bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
            >
              Dossiers à instruire
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${activeTab === "messages" ? "bg-slate-900 dark:bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
            >
              Reclamations & Messages ({messages.filter((m) => !m.isProcessed).length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${activeTab === "users" ? "bg-slate-900 dark:bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"}`}
            >
              Rôles & Agent Conseil ({usersList.length})
            </button>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Agent connecté : {currentUserEmail}</span>
        </div>

        {/* LOADING ANCHOR */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
            <span className="text-xs font-mono">Synchronisation avec les registres de Libreville...</span>
          </div>
        ) : (
          <>
            {/* VIEW 1: INSTRUCTION DOSSIERS TAB */}
            {activeTab === "dossiers" && (
              <div className="space-y-4 text-left">
                
                {/* ADVANCED MULTI-FILTERS FOR AGENTS */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                  <div className="relative col-span-2">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Chercher par n° de suivi, email citoyen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    >
                      <option value="ALL">Tous les statuts</option>
                      <option value="SUBMITTED">Nouveaux dossiers</option>
                      <option value="PROCESSING">En instruction</option>
                      <option value="APPROVED">Validés / Délivrés</option>
                      <option value="REJECTED">Rejetés</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    >
                      <option value="ALL">Toutes les catégories</option>
                      <option value="birth">Naissance</option>
                      <option value="marriage">Mariage</option>
                      <option value="id">Identité (CNI / CNI.P)</option>
                      <option value="permit">Permis Construire</option>
                      <option value="work">Autorisation Travaux</option>
                    </select>
                  </div>
                </div>

                {filteredDossiers.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 font-mono">
                    Aucun dossier ne correspond à vos filtres d'agent.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                      <thead className="bg-slate-50 dark:bg-slate-850">
                        <tr>
                          <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-550 uppercase font-mono uppercase tracking-wider">Référence / Date</th>
                          <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-550 uppercase font-mono uppercase tracking-wider">Citoyen</th>
                          <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-550 uppercase font-mono uppercase tracking-wider">Démarche</th>
                          <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-550 uppercase font-mono uppercase tracking-wider">Détails de l'acte</th>
                          <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-550 uppercase font-mono uppercase tracking-wider">Statut</th>
                          <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-550 uppercase font-mono uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
                        {filteredDossiers.map((d) => {
                          const theme = getStatusTheme(d.status);
                          return (
                            <tr key={d.ref} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                              <td className="px-5 py-3 whitespace-nowrap">
                                <span className="font-mono text-xs font-bold block text-slate-900 dark:text-white">{d.ref}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">{d.date ? formatDate(d.date) : "N/A"}</span>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <span className="font-mono text-xs block text-slate-900 dark:text-white truncate max-w-[160px]">{d.citizenEmail}</span>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">{d.typeLabel}</span>
                              </td>
                              <td className="px-5 py-3">
                                <p className="text-xs text-slate-550 dark:text-slate-400 line-clamp-1 max-w-sm truncate">{d.details}</p>
                                {d.comments && (
                                  <p className="text-[10px] text-amber-600 italic truncate max-w-xs">&bull; Notes: "{d.comments}"</p>
                                )}
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
                                  {theme.label}
                                </span>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap text-right text-xs">
                                <button
                                  onClick={() => { setSelectedDossier(d); setActionStatus(d.status); setActionComments(d.comments || ""); }}
                                  className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-850 text-white rounded font-semibold transition-colors cursor-pointer"
                                >
                                  Évaluer
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: CLAIMS / MESSAGES MESSAGING PANEL */}
            {activeTab === "messages" && (
              <div className="space-y-4 text-left">
                <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Réclamations d'élus et messages de proximité</h3>

                {messages.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 font-mono">
                    Aucun message citoyen n'a été déposé pour le moment.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {messages.map((m) => (
                      <div key={m.id} className={`p-5 rounded-2xl border ${m.isProcessed ? "border-slate-100 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-850/20" : "border-red-500/10 bg-red-400/5"} transition-colors`}>
                        <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                          <div>
                            <span className="text-[9px] uppercase font-mono tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded mr-2 font-bold">
                              {m.subject}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{m.fullName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                            <span>{new Date(m.createdAt).toLocaleDateString("fr-FR")}</span>
                            {m.isProcessed ? (
                              <span className="text-emerald-500 font-semibold px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center space-x-1">
                                <Check className="h-3 w-3" /> <span>Traité</span>
                              </span>
                            ) : (
                              <span className="text-amber-500 font-semibold px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center space-x-1 animate-pulse">
                                <AlertCircle className="h-3 w-3" /> <span>À traiter</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/30 p-3 rounded-lg leading-relaxed mb-4 border border-slate-50 dark:border-slate-800 font-light">
                          {m.message}
                        </p>

                        {m.isProcessed ? (
                          <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-mono uppercase font-bold text-slate-400">Réponse de la mairie :</span>
                            <p className="text-[11px] text-slate-650 dark:text-slate-350 italic mt-1 font-light leading-snug">"{m.response}"</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setSelectedMsg(m); setMsgResponse(""); }}
                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                          >
                            <span>Répondre & clôturer l'incident</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: CITIZEN REGISTRY & ROLE DELEGATION */}
            {activeTab === "users" && (
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Registre Général des Utilisateurs Portalisés</h3>
                  <p className="text-xs text-slate-500">Attribuez des profils (Maire, Agent, Vérificateur d'État Civil) en toute sécurité.</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-850">
                      <tr>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-550 uppercase font-mono tracking-wider">Utilisateur</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-550 uppercase font-mono tracking-wider">Identité physique</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-550 uppercase font-mono tracking-wider">Rôle Principal</th>
                        <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-550 uppercase font-mono tracking-wider">Assignation</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
                      {usersList.map((u) => (
                        <tr key={u.id}>
                          <td className="px-5 py-3 whitespace-nowrap font-mono text-xs text-slate-900 dark:text-white">{u.email}</td>
                          <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-350">
                            {u.firstName ? `${u.firstName} ${u.lastName}` : <span className="text-slate-400 italic font-mono text-[10px]">Profil non renseigné</span>}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-0.5 text-[9px] font-mono uppercase font-bold rounded ${u.role === "admin" ? "bg-red-500/10 text-red-500 border border-red-500/20" : u.role === "agent" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right text-xs space-x-2">
                            <button
                              disabled={u.email === currentUserEmail}
                              onClick={() => handleRoleChange(u.id, "agent")}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-755 text-slate-800 dark:text-white rounded text-[10px] font-semibold disabled:opacity-50"
                            >
                              Agent
                            </button>
                            <button
                              disabled={u.email === currentUserEmail}
                              onClick={() => handleRoleChange(u.id, "citoyen")}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-755 text-slate-800 dark:text-white rounded text-[10px] font-semibold disabled:opacity-50"
                            >
                              Citoyen
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DRAW EVALUATION COMPONENT SCREEN MODAL */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 overflow-y-auto p-4 flex items-center justify-center font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white max-w-lg w-full rounded-2xl shadow-2xl p-6 text-left space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase font-mono bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded font-bold">
                  {selectedDossier.typeLabel}
                </span>
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white mt-1.5">Évaluation du Dossier : {selectedDossier.ref}</h4>
              </div>
              <button onClick={() => setSelectedDossier(null)} className="text-slate-400 hover:text-slate-500 font-bold block bg-slate-100 dark:bg-slate-800 h-6 w-6 rounded-full flex items-center justify-center">&times;</button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl space-y-2 text-xs leading-normal font-light">
              <p><strong className="font-semibold text-slate-800 dark:text-slate-200">Citoyen Declarant :</strong> {selectedDossier.citizenEmail}</p>
              <p><strong className="font-semibold text-slate-800 dark:text-slate-200">Acte administratif :</strong> {selectedDossier.details}</p>
              {selectedDossier.dossier && selectedDossier.dossier.documentUrl && (
                <p><strong className="font-semibold text-slate-800 dark:text-slate-200">Document Transmis :</strong> <a href={selectedDossier.dossier.documentUrl} target="_blank" className="text-emerald-500 underline font-mono">Inspecter le document</a></p>
              )}
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">Statut d'instruction de l'acte *</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="SUBMITTED">Soumis (Nouveau)</option>
                  <option value="PROCESSING">En instruction / Étude technique</option>
                  <option value="APPROVED">Approuver & Valider</option>
                  <option value="COMPLETED">Complété & Délivré</option>
                  <option value="REJECTED">Rejeter ce dossier</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 block">Commentaires / Décision de l'agent *</label>
                <textarea
                  rows={3}
                  required
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  placeholder="Justifiez la décision règlementaire ou spécifiez les pièces physiques manquantes à fournir à l'Hôtel de Ville..."
                  className="w-full px-4 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-light"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold ring-offset-2 hover:ring-2 hover:ring-emerald-500 cursor-pointer"
                >
                  Enregistrer l'évaluation
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDossier(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED ANSWER MESSAGE MODAL DRAWER */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 overflow-y-auto p-4 flex items-center justify-center font-sans">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white max-w-md w-full rounded-2xl shadow-2xl p-6 text-left space-y-4">
            <h4 className="font-display font-bold text-sm tracking-tight">Répondre au message : {selectedMsg.fullName}</h4>
            
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-xs font-light space-y-1">
              <p><strong className="font-semibold text-slate-800 dark:text-slate-200">Email :</strong> {selectedMsg.email}</p>
              <p><strong className="font-semibold text-slate-800 dark:text-slate-200">Sujet :</strong> {selectedMsg.subject}</p>
              <p className="mt-2 text-slate-650 dark:text-slate-400 italic">"{selectedMsg.message}"</p>
            </div>

            <form onSubmit={handleMessageReply} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-750 dark:text-slate-300 block">Votre réponse officielle *</label>
                <textarea
                  rows={4}
                  required
                  value={msgResponse}
                  onChange={(e) => setMsgResponse(e.target.value)}
                  placeholder="Écrivez votre réponse de proximité pour le citoyen..."
                  className="w-full px-4 py-2.5 text-xs font-light rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 leading-normal"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Envoyer la réponse
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMsg(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-800 dark:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
