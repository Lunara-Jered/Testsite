import React, { useState } from "react";
import { 
  Building2, 
  Phone, 
  Menu, 
  X, 
  LogIn, 
  LogOut, 
  User, 
  Bell, 
  Sun, 
  Moon,
  LayoutDashboard
} from "lucide-react";
import { CitizenUser, Notification } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface HeaderNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: any;
  dbUser: CitizenUser | null;
  notifications: Notification[];
  onLogin: () => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  setCurrentTab,
  user,
  dbUser,
  notifications,
  onLogin,
  onLogout,
  darkMode,
  setDarkMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navigateTo = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { id: "accueil", label: "Accueil" },
    { id: "demarches", label: "Démarches" },
    { id: "actualites", label: "Actualités" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-all">
      {/* Top emergency ribbon */}
      <div className="w-full bg-slate-900 text-slate-100 py-1.5 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Urgences Libreville :</span>
            <a href="tel:1300" className="flex items-center hover:text-emerald-400 transition-colors font-mono font-bold text-red-400">
              <Phone className="h-3 w-3 mr-1" /> Urgence (1300)
            </a>
            <a href="tel:1722" className="flex items-center hover:text-emerald-400 transition-colors font-mono font-bold text-blue-400">
              <Phone className="h-3 w-3 mr-1" /> Police Secours (1722)
            </a>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-slate-400">Horaires d'ouverture :</span>
            <span>Lun-Ven 7h30 - 15h30, Sam (Permanence) 9h00 - 12h00</span>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo Brand Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigateTo("accueil")}>
            <div className="h-10 w-10 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md">
              <Building2 className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-slate-900 dark:text-white leading-none block tracking-tight">
                Mairie de Libreville
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#d97706] dark:text-amber-400 block mt-0.5 leading-none font-semibold">
                République Gabonaise
              </span>
            </div>
          </div>

          {/* Desktop Links Grid */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => navigateTo(link.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* User & Settings Panel Right side */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Theme trigger */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title={darkMode ? "Mode Clair" : "Mode Sombre"}
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Notifications panel toggle */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors relative"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                <AnimatePresence>
                  {showNotifDropdown && (
                    <>
                      <div className="fixed inset-0 z-40 outline-none" onClick={() => setShowNotifDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl z-5 relative overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                          <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white">Notifications</h4>
                          <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            {unreadCount} nouvelles
                          </span>
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                              Aucune notification pour le moment.
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <div key={n.id} className={`p-4 text-left transition-colors ${n.isRead ? "opacity-75" : "bg-slate-50/50 dark:bg-slate-850"}`}>
                                <h5 className="font-semibold text-xs text-slate-900 dark:text-white mb-0.5">{n.title}</h5>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 leading-relaxed">{n.message}</p>
                                <span className="text-[9px] font-mono text-slate-400">{new Date(n.createdAt).toLocaleDateString("fr-FR")}</span>
                              </div>
                            ))
                          )}
                        </div>
                        {user && (
                          <button
                            onClick={() => { navigateTo("dashboard"); setShowNotifDropdown(false); }}
                            className="w-full py-2 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-750 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 py-3 transition-colors block"
                          >
                            Voir l'Espace Citoyen
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Login control flow */}
            {!user ? (
              <button
                onClick={onLogin}
                className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <LogIn className="h-4 w-4" />
                <span>Espace Citoyen</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Dashboard Tab Shortcut */}
                <button
                  onClick={() => navigateTo((dbUser?.role === "admin" || dbUser?.role === "agent") ? "agent" : "dashboard")}
                  className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-250 text-xs font-semibold rounded-lg cursor-pointer transition-all"
                  title="Accéder au pupitre"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">Mon Espace</span>
                </button>
                
                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            )}

            {/* Mobile menu triggers */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2 relative shadow-inner overflow-hidden"
          >
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => navigateTo(link.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors block ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
            
            {!user && (
              <button
                onClick={() => { onLogin(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center space-x-1.5 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl text-sm mt-3"
              >
                <LogIn className="h-4 w-4" />
                <span>Espace Citoyen</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
