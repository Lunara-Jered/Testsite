import React, { useState } from "react";
import { 
  Baby, 
  Heart, 
  Trash2, 
  FolderCheck, 
  Wrench, 
  Building2, 
  MapPin, 
  Clock, 
  ArrowRight,
  Send,
  Calendar,
  AlertTriangle,
  UserPlus
} from "lucide-react";
import { MairieService, NewsArticle, MairieEvent } from "../types";
import { motion } from "motion/react";

interface MainPortalProps {
  services: MairieService[];
  news: NewsArticle[];
  events: MairieEvent[];
  setCurrentTab: (tab: string) => void;
  setSelectedServiceSlug: (slug: string) => void;
  onLogin: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const MainPortal: React.FC<MainPortalProps> = ({
  services,
  news,
  events,
  setCurrentTab,
  setSelectedServiceSlug,
  onLogin,
  addToast,
}) => {
  const [contactSubject, setContactSubject] = useState("GENERAL");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Trigger service checkout or checkout declaration
  const handleStartService = (slug: string) => {
    setSelectedServiceSlug(slug);
    setCurrentTab("checkout-service"); // Navigate to multi-step wizard
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) {
      addToast("Veuillez remplir tous les champs obligatoires (*) du formulaire.", "error");
      return;
    }

    setSendingMessage(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: contactSubject,
          fullName: contactName,
          email: contactEmail,
          phone: contactPhone,
          message: contactMsg
        })
      });

      if (res.ok) {
        addToast("Votre message a été transmis avec succès aux services municipaux.", "success");
        setContactName("");
        setContactEmail("");
        setContactPhone("");
        setContactMsg("");
        setContactSubject("GENERAL");
      } else {
        addToast("Impossible d'expédier votre formulaire pour le moment.", "error");
      }
    } catch (err) {
      addToast("Erreur réseau. Veuillez réessayer.", "error");
    } finally {
      setSendingMessage(false);
    }
  };

  // Popular Services details mapping
  const popularServicesData = [
    {
      title: "Naissance",
      desc: "Acte et déclaration officielle de naissance en ligne.",
      slug: "acte-naissance",
      icon: Baby,
      color: "from-blue-500/10 to-indigo-500/10",
      iconColor: "text-blue-500"
    },
    {
      title: "Mariage",
      desc: "Préparation et dépôt sécurisé de votre dossier de célébration de mariage.",
      slug: "mariage",
      icon: Heart,
      color: "from-pink-500/10 to-red-500/10",
      iconColor: "text-pink-500"
    },
  ];

  return (
    <div className="space-y-4">
      
      {/* 1. HERO SECTION WITH EMBEDDED FLAG COLOR BAND */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 text-white min-h-[460px] flex items-center shadow-xl">
        {/* Flag Stripes Background Accent Corner */}
        <div className="absolute top-0 right-0 h-4 w-full flex">
          <div className="bg-[#417630] flex-1"></div> {/* Gabonese Green */}
          <div className="bg-[#fad400] flex-1"></div> {/* Gabonese Yellow */}
          <div className="bg-[#1e58a2] flex-1"></div> {/* Gabonese Blue */}
        </div>

        {/* Ambient Dark Banner Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200')" }}
        />
        
        {/* Soft radial glow */}
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent opacity-60"></div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12 md:py-16 text-center space-y-6">
          <span className="inline-block px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-mono tracking-widest uppercase font-bold border border-amber-400/20">
            Hôtel de Ville de Libreville
          </span>
          <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-none">
            Votre Mairie dans la poche
          </h1>
          <p className="font-sans text-slate-300 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Effectuez vos démarches en toute sécurité
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setCurrentTab("demarches")}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-emerald-600/10 cursor-pointer transition-all flex items-center justify-center space-x-2"
            >
              <span>Découvrir tous les services</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-205 border border-slate-700 text-sm font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center space-x-2"
            >
              <UserPlus className="h-4 w-4 text-emerald-400" />
              <span>Créer mon Espace Citoyen</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. EMERGENCY CONTACTS GRID BANNER */}
      <section className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 flex-col md:flex-row">
        <div className="flex items-center space-x-3 text-left">
          <div className="p-2.5 bg-red-500 text-white rounded-xl">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-red-950 dark:text-red-400">Services d'Urgences Municipaux</h3>
            <p className="text-xs text-red-700 dark:text-red-400/80">Assistance rapide, accidents de voirie, incendies ou sécurité de secours de Libreville.</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <a href="tel:1300" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow font-mono text-sm font-bold block">
            Urgence : 1300
          </a>
          <a href="tel:1722" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-mono text-sm font-bold block">
            Police : 1722
          </a>
        </div>
      </section>

      {/* 3. CENTRAL HUB: MOT DU MAIRE + POPULAR SERVICES */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Mot de Monsieur le Maire column */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="font-display font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span>Mot de Monsieur le Maire</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono uppercase font-semibold">Message officiel</span>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col">
            <div className="relative h-44 w-full sm:w-44 lg:w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner shrink-0">
              {/* Fallback pattern simulation or mayor picture */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-3">
                <div>
                  <h4 className="text-xs font-bold text-white font-display">Pr. Mba-Obame</h4>
                  <p className="text-[10px] text-emerald-400 font-medium">Maire de la Commune de Libreville</p>
                </div>
              </div>
            </div>
            <div className="text-left space-y-3">
              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed italic font-light">
                "Chers concitoyens, bienvenue sur votre portail mobile optimisé. Nous continuons la modernisation numérique de notre administration pour vous offrir un service fluide et accessible 24h/24."
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-light">
                Notre engagement est de mettre la technologie à l'appui du service public afin de lever les lourdeurs administratives de l'État Civil et d'optimiser l'urbanisme communal de notre capitale.
              </p>
            </div>
          </div>
        </div>

        {/* Popular Services Section (Demarches Populaires) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-left">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">Démarches Populaires</h2>
            <button onClick={() => setCurrentTab("demarches")} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1">
              <span>Voir tout</span> <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {popularServicesData.map((s, idx) => {
                const IconComp = s.icon;
                return (
                  <div key={idx} className={`p-5 rounded-2xl bg-gradient-to-br ${s.color} border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between h-48`}>
                    <div>
                      <div className={`h-10 w-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center ${s.iconColor} shadow-sm mb-3`}>
                        <IconComp className="h-5 w-5" />
                      </div>
                      <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white mb-1">{s.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{s.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleStartService(s.slug)}
                      className="mt-4 w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-900 dark:text-white border border-slate-205 dark:border-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors text-center"
                    >
                      Commencer la démarche
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Other informational highlights for local administrative campaigns */}
            <div className="bg-slate-50 dark:bg-slate-850/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
              <h5 className="font-display font-bold text-xs text-slate-900 dark:text-white mb-3">Autres chantiers municipaux d'envergure</h5>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 text-xs">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg mt-0.5">
                    <Trash2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Campagne de Salubrité urbaine</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">Grand nettoyage citoyen programmé ce samedi dans les arrondissements de Libreville.</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 text-xs">
                  <div className="p-1.5 bg-indigo-105 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg mt-0.5">
                    <FolderCheck className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Modernisation de l'État Civil</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">Nouveau dispositif numérique sécurisé pour le traitement rapide de vos actes administratifs.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-xs">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg mt-0.5">
                    <Wrench className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Aménagement de la Voie Publique</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">Lancement des chantiers de réhabilitation des axes secondaires et éclairage LED.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 4. ACTUALITÉS LOCALES DE LIBREVILLE */}
      <section className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-left">
        <h2 className="font-display font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <span>Actualités municipales</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline" onClick={() => setCurrentTab("actualites")}>
            Toutes les actus &rarr;
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((n) => (
            <div key={n.id} className="group flex flex-col bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-all">
              <div className="h-40 bg-slate-200/50 dark:bg-slate-800 relative overflow-hidden">
                {n.featuredImage ? (
                  <img src={n.featuredImage} referrerPolicy="no-referrer" alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Building2 className="h-10 w-10" />
                  </div>
                )}
                {n.isFeatured && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    À la Une
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold block mb-1">
                    {new Date(n.publicationDate).toLocaleDateString("fr-FR")}
                  </span>
                  <h4 className="font-display font-semibold text-xs text-slate-900 dark:text-white line-clamp-2">{n.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 mt-1.5 leading-relaxed font-light">{n.summary}</p>
                </div>
                <button
                  onClick={() => setCurrentTab("actualites")}
                  className="w-full text-left font-display font-semibold text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline block pt-2 mt-auto"
                >
                  Lire la suite &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SECTIONS: ALL SERVICES CATEGORIES */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden text-left shadow-lg">
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 lg:max-w-lg">
            <h2 className="font-display font-bold text-xl md:text-2xl text-white tracking-tight">Démarches & Services Communaux</h2>
            <p className="text-slate-300 text-xs leading-relaxed font-light">
              Notre équipe instruit vos dossiers avec professionnalisme et célérité. Sélectionnez votre démarche ou connectez-vous pour un parcours dématérialisé.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:max-w-xl">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between h-36">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-400">Section</span>
                <h4 className="font-display font-bold text-sm text-white mt-1">État Civil</h4>
                <p className="text-[11px] text-slate-400 mt-1">Actes de naissance, déclarations de célébration de mariages, cartes nationales d'identité.</p>
              </div>
              <button onClick={() => setCurrentTab("demarches")} className="text-[11px] font-bold text-white hover:underline text-left inline-flex items-center space-x-1 mt-2">
                <span>Accéder</span> <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between h-36">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-400">Section</span>
                <h4 className="font-display font-bold text-sm text-white mt-1">Urbanisme & Travaux</h4>
                <p className="text-[11px] text-slate-400 mt-1">Permis de construire règlementaires, requêtes d'aménagement de voirie publique.</p>
              </div>
              <button onClick={() => setCurrentTab("demarches")} className="text-[11px] font-bold text-white hover:underline text-left inline-flex items-center space-x-1 mt-2">
                <span>Accéder</span> <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONTACT & LOCATION / MOCK LEAFLET MAP */}
      <section id="contact-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Contact form (Submission) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-left">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white">Formulaire de Contact Citoyen</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Envoyez vos questions, doléances ou doléances règlementaires à nos services communaux.</p>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block">Objet du contact *</label>
                <select
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="GENERAL">Demande d'information générale</option>
                  <option value="CIVIL_REGISTRY">Département de l'État Civil</option>
                  <option value="URBANISM">Département de l'Urbanisme & Travaux</option>
                  <option value="COMPLAINT">Déposer une Réclamation</option>
                  <option value="SUGGESTION">Faire une Suggestion</option>
                </select>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ex: Jean-Marie Nguema"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block">Adresse Email *</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Ex: jean.nguema@gmail.com"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block">Numéro de Téléphone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Ex: 077 22 33 44"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block">Message *</label>
              <textarea
                required
                rows={4}
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder="Explicitez votre demande de façon détaillée..."
                className="w-full px-4 py-2.5 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 leading-relaxed font-light"
              />
            </div>

            <button
              type="submit"
              disabled={sendingMessage}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-center space-x-2 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sendingMessage ? "Transmission..." : "Envoyer le message"}</span>
            </button>
          </form>
        </div>

        {/* Location / hours page details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-left space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">Coordonnées de l'Hôtel de Ville</h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Adresse Physique</span>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Hôtel de Ville de Libreville,<br />
                    Place de l'Indépendance,<br />
                    B.P. 51 Libreville, Gabon
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Horaires Règlementaires</span>
                  <p className="text-slate-505 dark:text-slate-400 font-light">
                    Lundi au Vendredi : 7h30 - 15h30
                  </p>
                  <p className="text-slate-505 dark:text-slate-400 font-light">
                    Samedi (Permanence État Civil) : 9h00 - 12h00
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaflet-like beautiful vectorized Map card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm text-left overflow-hidden relative min-h-[220px] flex flex-col justify-between">
            <div className="absolute inset-0 bg-[#1e293b]/70 mix-blend-overlay"></div>
            {/* Grid pattern overlay simulates maps */}
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(#10b981 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
            
            <div className="relative z-10 space-y-1">
              <span className="text-[9px] uppercase font-mono tracking-widest font-semibold text-emerald-400">Position Géographique</span>
              <h4 className="font-display font-bold text-sm text-white">Localiser l'Hôtel de Ville</h4>
              <p className="text-[11px] text-slate-300 font-light leading-relaxed">Place de l'Indépendance, surplombant le front de mer à proximité immédiate du Boulevard Triomphal.</p>
            </div>

            <div className="relative z-10 bg-slate-950/85 border border-slate-800 rounded-xl p-3 flex items-center justify-between mt-6">
              <div className="flex items-center space-x-2.5">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="text-left">
                  <span className="font-bold text-[10px] block text-white leading-none">Mairie de Libreville</span>
                  <span className="text-[8px] text-slate-400 font-mono leading-none mt-0.5 block">Latitude: 0.3892° N, Longitude: 9.4516° E</span>
                </div>
              </div>
              <a 
                href="https://maps.google.com/?q=Hotel+de+Ville+Libreville+Gabon" 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="text-[9px] font-bold text-emerald-400 hover:underline hover:text-emerald-300"
              >
                Itinéraire &rarr;
              </a>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
};
