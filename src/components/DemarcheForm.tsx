import React, { useState, useRef } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  FileCheck, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Clock, 
  DollarSign, 
  User, 
  Heart, 
  Baby, 
  Wrench, 
  Building
} from "lucide-react";
import { MairieService, CitizenUser } from "../types";
import { formatCFA } from "../utils/format";

interface DemarcheFormProps {
  service: MairieService;
  dbUser: CitizenUser;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  setCurrentTab: (tab: string) => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const DemarcheForm: React.FC<DemarcheFormProps> = ({
  service,
  dbUser,
  fetchWithAuth,
  setCurrentTab,
  addToast,
}) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Drag and drop uploaders file state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Form Fields depending on the service category / slug
  const [formData, setFormData] = useState<Record<string, string>>({
    // General / Birth
    childFirstName: "",
    childLastName: "",
    childGender: "MASCULIN",
    childBirthDate: "",
    childBirthPlace: "Centre Hospitalier Universitaire de Libreville",
    fatherFullName: "",
    fatherProfession: "",
    motherFullName: "",
    motherProfession: "",
    
    // Marriage
    groomFullName: "",
    groomBirthDate: "",
    groomAddress: "",
    groomProfession: "",
    brideFullName: "",
    brideBirthDate: "",
    brideAddress: "",
    brideProfession: "",
    celebrationDate: "",
    witnessGroomName: "",
    witnessBrideName: "",

    // ID
    heightCm: "175",
    eyeColor: "MARRON",
    previousCniNumber: "",
    profession: "",

    // Building Permit / Roads
    projectName: "",
    siteAddress: "",
    district: dbUser.district || "1er Arrondissement",
    cadastralNumber: "",
    architectLicense: "",
    roadDurationDays: "15",
    worksNature: ""
  });

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Drag counter handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
      addToast(`Fichier "${file.name}" attaché pour l'instruction réglementaire.`, "success");
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      addToast(`Fichier "${file.name}" attaché pour l'instruction réglementaire.`, "success");
    }
  };

  const triggerManualFileInput = () => {
    fileInputRef.current?.click();
  };

  const validateStep = () => {
    if (step === 2) {
      if (service.slug === "acte-naissance") {
        if (!formData.childFirstName || !formData.childLastName || !formData.childBirthDate || !formData.motherFullName) {
          addToast("Veuillez remplir les informations obligatoires de naissance.", "error");
          return false;
        }
      } else if (service.slug === "mariage") {
        if (!formData.groomFullName || !formData.brideFullName || !formData.celebrationDate) {
          addToast("Veuillez renseigner le nom des futurs époux et la date de célébration voulue.", "error");
          return false;
        }
      } else if (service.slug === "carte-identite") {
        if (!formData.profession) {
          addToast("Indiquez votre profession actuelle pour la carte nationale d'identité.", "error");
          return false;
        }
      } else if (service.slug === "permis-construire") {
        if (!formData.projectName || !formData.siteAddress || !formData.cadastralNumber) {
          addToast("Spécifiez le nom du projet, son emplacement et le numéro cadastral.", "error");
          return false;
        }
      } else if (service.slug === "autorisation-travaux") {
        if (!formData.worksNature || !formData.siteAddress) {
          addToast("Décrivez la nature des travaux de terrassement sur la voie publique.", "error");
          return false;
        }
      }
    }

    if (step === 3 && !uploadedFile) {
      addToast("Vous devez téléverser au moins un document justificatif numérisé (*).", "error");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((p) => p + 1);
    }
  };

  const handleBack = () => {
    setStep((p) => p - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      addToast("Le justificatif est requis pour évaluer la démarche réglementaire.", "error");
      return;
    }

    setSubmitting(true);
    let detailsSummary = "";

    // Design the details summary depending on subcategory
    if (service.slug === "acte-naissance") {
      detailsSummary = `Naissance de ${formData.childFirstName} ${formData.childLastName} le ${formData.childBirthDate}. Mère: ${formData.motherFullName}.`;
    } else if (service.slug === "mariage") {
      detailsSummary = `Futur Époux: ${formData.groomFullName} & Future Épouse: ${formData.brideFullName}. Célébration le ${formData.celebrationDate}.`;
    } else if (service.slug === "carte-identite") {
      detailsSummary = `Renouvellement CNI. Profession: ${formData.profession}. N° Ancien: ${formData.previousCniNumber || "N/A"}.`;
    } else if (service.slug === "permis-construire") {
      detailsSummary = `Chantier: ${formData.projectName} à l'emplacement ${formData.siteAddress} (Arrond: ${formData.district}). Parcelle: ${formData.cadastralNumber}.`;
    } else {
      detailsSummary = `Travaux sur voie publique: ${formData.worksNature} - rue: ${formData.siteAddress}. Durée: ${formData.roadDurationDays} jours.`;
    }

    try {
      const res = await fetchWithAuth("/api/citizen/dossiers", {
        method: "POST",
        body: JSON.stringify({
          type: service.slug === "acte-naissance" ? "birth" : 
                service.slug === "mariage" ? "marriage" : 
                service.slug === "carte-identite" ? "id" : 
                service.slug === "permis-construire" ? "permit" : "work",
          typeLabel: service.name,
          details: detailsSummary,
          documentUrl: `https://example.com/mock-upload-${Date.now()}-${uploadedFile.name.replace(/ /g, "_")}`
        })
      });

      if (res.ok) {
        addToast("Votre démarche dématérialisée a été soumise au service d'état civil.", "success");
        setCurrentTab("dashboard"); // Go to Tracking Dashboard
      } else {
        addToast("Impossible d'enregistrer votre dossier en ligne.", "error");
      }
    } catch (err) {
      addToast("Erreur d'accès aux services. Veuillez réessayer.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden text-left">
      
      {/* HEADER WIZARD BAR */}
      <div className="bg-slate-900 text-white p-6 border-b border-white/5 relative">
        <div className="absolute top-0 right-0 h-1.5 w-full bg-emerald-500"></div>
        <button
          onClick={() => setCurrentTab("demarches")}
          className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 mb-2 pointer-events-auto cursor-pointer"
        >
          <ArrowLeft className="h-3 w-3" /> <span>Retour aux démarches</span>
        </button>
        <h3 className="font-display font-bold text-lg tracking-tight">{service.name}</h3>
        <p className="text-xs text-slate-300 leading-normal mt-0.5 font-light">{service.description}</p>
        
        {/* Step indicator */}
        <div className="flex items-center space-x-2 mt-4 text-[10px] font-mono tracking-wider font-semibold text-emerald-400 uppercase">
          <span>Étape {step} sur 4</span>
          <span>&bull;</span>
          <span>
            {step === 1 ? "Instructions & Pièces" : 
             step === 2 ? "Détails du Formulaire" : 
             step === 3 ? "Téléversement Justificatifs" : "Vérification Finale"}
          </span>
        </div>
      </div>

      {/* STEP BODY */}
      <div className="p-6 md:p-8 space-y-6">
        
        {/* 1. STATE CIVIL DEMARCHE STEP 1: INSTRUCTIONS */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1.5">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Délai estimé</span>
                <span className="text-xs font-semibold text-slate-905 dark:text-slate-100 block">{service.estimatedTime}</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1.5">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Frais de timbre</span>
                <span className="text-xs font-semibold text-slate-905 dark:text-slate-100 block">{formatCFA(service.feeAmount)}</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-1.5">
                <FileCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Nature</span>
                <span className="text-xs font-semibold text-slate-905 dark:text-slate-100 block">Enregistrement Garanti</span>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-amber-450/5 border border-amber-500/10 rounded-2xl">
              <h4 className="font-display font-semibold text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Documents originaux requis à téléverser :</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-xs whitespace-pre-line leading-relaxed font-light pl-5">
                {service.requiredDocuments}
              </p>
            </div>

            <div className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed font-light p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl">
              <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Rappel Législatif :</span>
              Toute fausse déclaration ou falsification de documents d'état civil d'autres citoyens est passible de sanctions conformément au code pénal de la République Gabonaise. Vos coordonnées IP et d'Espace Citoyen sont rattachées de façon sécurisée à cette soumission administrative.
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer flex items-center space-x-1.5 transition-all"
              >
                <span>Saisir le formulaire</span> <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 2. STATE CIVIL DEMARCHE STEP 2: FIELDS WRITER */}
        {step === 2 && (
          <div className="space-y-6">
            
            {/* SUB-FORM 1: NAISSANCE */}
            {service.slug === "acte-naissance" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-805 pb-2">
                  <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Identité du Nouveau-Né</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Prénoms de l'enfant *</label>
                    <input
                      type="text"
                      required
                      value={formData.childFirstName}
                      onChange={(e) => handleFieldChange("childFirstName", e.target.value)}
                      placeholder="Ex: Jean-Aimé"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Nom de famille de l'enfant *</label>
                    <input
                      type="text"
                      required
                      value={formData.childLastName}
                      onChange={(e) => handleFieldChange("childLastName", e.target.value)}
                      placeholder="Ex: Nguema"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Sexe *</label>
                    <select
                      value={formData.childGender}
                      onChange={(e) => handleFieldChange("childGender", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    >
                      <option value="MASCULIN">Masculin</option>
                      <option value="FEMININ">Féminin</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Date de Naissance *</label>
                    <input
                      type="date"
                      required
                      value={formData.childBirthDate}
                      onChange={(e) => handleFieldChange("childBirthDate", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Lieu d'accouchement *</label>
                    <input
                      type="text"
                      required
                      value={formData.childBirthPlace}
                      onChange={(e) => handleFieldChange("childBirthPlace", e.target.value)}
                      placeholder="Ex: Maternité CHUL"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-805 pt-3 pb-1">
                  <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Identité des Parents</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left font-light leading-normal">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Nom complet de la mère *</label>
                    <input
                      type="text"
                      required
                      value={formData.motherFullName}
                      onChange={(e) => handleFieldChange("motherFullName", e.target.value)}
                      placeholder="Ex: Marie-Catherine Obone"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5 text-left font-light leading-normal">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Nom complet du père (optionnel)</label>
                    <input
                      type="text"
                      value={formData.fatherFullName}
                      onChange={(e) => handleFieldChange("fatherFullName", e.target.value)}
                      placeholder="Ex: Jean-Luc Nguema"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-FORM 2: MARIAGE */}
            {service.slug === "mariage" && (
              <div className="space-y-6">
                
                {/* Groom */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-805 pb-2">
                    <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white text-left">Fiche de l'Époux (Futur)</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Nom complet de l'époux *</label>
                      <input
                        type="text"
                        required
                        value={formData.groomFullName}
                        onChange={(e) => handleFieldChange("groomFullName", e.target.value)}
                        placeholder="Ex: Jean-Claude Ndong"
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Profession de l'époux</label>
                      <input
                        type="text"
                        value={formData.groomProfession}
                        onChange={(e) => handleFieldChange("groomProfession", e.target.value)}
                        placeholder="Ex: Cadre télécoms"
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Bride */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-805 pb-2">
                    <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white text-left">Fiche de l'Épouse (Future)</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Nom complet de l'épouse *</label>
                      <input
                        type="text"
                        required
                        value={formData.brideFullName}
                        onChange={(e) => handleFieldChange("brideFullName", e.target.value)}
                        placeholder="Ex: Grace Obone"
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Profession de l'épouse</label>
                      <input
                        type="text"
                        value={formData.brideProfession}
                        onChange={(e) => handleFieldChange("brideProfession", e.target.value)}
                        placeholder="Ex: Comptable"
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Date planning */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-805 pb-2">
                    <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white text-left">Célébration à l'Hôtel de Ville</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Date souhaitée pour l'union *</label>
                      <input
                        type="date"
                        required
                        value={formData.celebrationDate}
                        onChange={(e) => handleFieldChange("celebrationDate", e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SUB-FORM 3: IDENTITY CNI */}
            {service.slug === "carte-identite" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-805 pb-2">
                  <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Signes distinctifs & profession</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Profession actuelle *</label>
                    <input
                      type="text"
                      required
                      value={formData.profession}
                      onChange={(e) => handleFieldChange("profession", e.target.value)}
                      placeholder="Ex: Fonctionnaire, Commerçant..."
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Numéro de l'ancienne carte (si renouvellement)</label>
                    <input
                      type="text"
                      value={formData.previousCniNumber}
                      onChange={(e) => handleFieldChange("previousCniNumber", e.target.value)}
                      placeholder="Ex: GP0283120"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Taille de l'individu (en cm)</label>
                    <input
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => handleFieldChange("heightCm", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Couleur des yeux</label>
                    <select
                      value={formData.eyeColor}
                      onChange={(e) => handleFieldChange("eyeColor", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    >
                      <option value="MARRON">Marron</option>
                      <option value="NOIR">Noir</option>
                      <option value="BLEU">Bleu</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-FORM 4: BUILDING PERMIT */}
            {service.slug === "permis-construire" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-805 pb-2">
                  <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Détails de l'ouvrage architectural</h4>
                </div>
                <div className="space-y-1.5 text-left font-light leading-normal">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Désignation du projet *</label>
                  <input
                    type="text"
                    required
                    value={formData.projectName}
                    onChange={(e) => handleFieldChange("projectName", e.target.value)}
                    placeholder="Ex: Construction d'une villa basse F4 avec dépendance"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Adresse foncière / Rue *</label>
                    <input
                      type="text"
                      required
                      value={formData.siteAddress}
                      onChange={(e) => handleFieldChange("siteAddress", e.target.value)}
                      placeholder="Ex: Mindoubé, à 200m de la station"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Numéro cadastral ou de Titre *</label>
                    <input
                      type="text"
                      required
                      value={formData.cadastralNumber}
                      onChange={(e) => handleFieldChange("cadastralNumber", e.target.value)}
                      placeholder="Ex: Section G, Parcelle 490"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Architecte de l'ordre (facultatif)</label>
                    <input
                      type="text"
                      value={formData.architectLicense}
                      onChange={(e) => handleFieldChange("architectLicense", e.target.value)}
                      placeholder="Ex: Ordre National n° ONAG/283"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-FORM 5: ROADS WORK AUTHORIZATION */}
            {service.slug === "autorisation-travaux" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-805 pb-2">
                  <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Nature de l'intervention de voirie</h4>
                </div>
                <div className="space-y-1.5 text-left font-light leading-normal">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Nature des travaux (tranchée, raccordement eau, fibre...) *</label>
                  <input
                    type="text"
                    required
                    value={formData.worksNature}
                    onChange={(e) => handleFieldChange("worksNature", e.target.value)}
                    placeholder="Ex: Pose de fourreaux de raccordement fibre optique sous chaussée"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left font-light leading-normal">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Nom de la rue / Avenue à occuper *</label>
                    <input
                      type="text"
                      required
                      value={formData.siteAddress}
                      onChange={(e) => handleFieldChange("siteAddress", e.target.value)}
                      placeholder="Ex: Avenue de Cointet, face pharmacie"
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Durée d'occupation temporaire (jours)</label>
                    <input
                      type="number"
                      value={formData.roadDurationDays}
                      onChange={(e) => handleFieldChange("roadDurationDays", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-205 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Nav tools */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={handleBack}
                className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg pointer-events-auto cursor-pointer"
              >
                Précédent
              </button>
              <button
                onClick={handleNext}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1"
              >
                <span>Attacher les pièces</span> <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        )}

        {/* 3. STATE CIVIL DEMARCHE STEP 3: FILE UPLOAD (DRAG AND DROP SUPPORTED) */}
        {step === 3 && (
          <div className="space-y-6">
            
            <div className="space-y-1 text-left">
              <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-white">Téléversement des pièces d'identité & Certificats</h4>
              <p className="text-slate-550 dark:text-slate-400 text-xs mt-1">S'il vous plaît joignez la numérisation certifiée de votre dossier.</p>
            </div>

            {/* Drag active frame container */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerManualFileInput}
              className={`border-2 border-dashed rounded-2xl p-8 hover:border-emerald-500 pointer-events-auto cursor-pointer transition-all text-center space-y-4 ${dragActive ? "border-emerald-500 bg-emerald-500/5" : "border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850"}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleManualFileSelect}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
              />

              <div className="h-12 w-12 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center mx-auto text-slate-400">
                <Upload className="h-5.5 w-5.5" />
              </div>

              <div>
                <span className="text-slate-800 dark:text-slate-250 font-bold text-xs block">Glissez et déposez votre document certifié ici</span>
                <span className="text-slate-400 text-[10px] block font-mono mt-1">Ou cliquez pour chercher dans l'ordinateur (PDF, PNG, JPG jusqu'à 10 Mo)</span>
              </div>
            </div>

            {/* Show selection */}
            {uploadedFile && (
              <div className="p-3 bg-semibold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/25 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span className="font-mono text-xs font-bold text-emerald-850 dark:text-emerald-400">{uploadedFile.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} Mo</span>
              </div>
            )}

            {/* Nav tools */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={handleBack}
                className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg pointer-events-auto cursor-pointer"
              >
                Précédent
              </button>
              <button
                onClick={handleNext}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1"
              >
                <span>Vérification finale</span> <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        )}

        {/* 4. STATE CIVIL DEMARCHE STEP 4: SUMMARY & DECISION REPORT */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-850/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 text-xs font-light">
              <h4 className="font-display font-semibold text-slate-900 dark:text-white text-sm">Vérification de votre déclaration dématérialisée</h4>
              <p>Veuillez relire attentivement le récapitulatif d'acte communal avant la transmission définitive aux services d'état civil d'Hôtel de Ville de Libreville.</p>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2 font-light">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Nature de la démarche</span>
                  <span className="font-bold text-slate-900 dark:text-white">{service.name}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Timbre fiscal applicable</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCFA(service.feeAmount)}</span>
                </div>
                {uploadedFile && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Justificatifs rattachés</span>
                    <span className="font-mono text-emerald-605">{uploadedFile.name} (Simulé)</span>
                  </div>
                )}
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Dépôt par</span>
                  <span className="font-mono">{dbUser.email}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-light">
              En cliquant sur "Soumettre mon dossier d'acte", vous certifiez sur l'honneur l'exactitude des justificatifs d'accompagnement. La Mairie de Libreville prendra contact avec vous par notification d'Espace Citoyen à chaque évolution d'instruction.
            </p>

            {/* Nav tools */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={handleBack}
                className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Précédent
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow flex items-center justify-center space-x-1.5"
              >
                <span>{submitting ? "Traitement de l'acte..." : "Soumettre mon dossier d'acte"}</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
