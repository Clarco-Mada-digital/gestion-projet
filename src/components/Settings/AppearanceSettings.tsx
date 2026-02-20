import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../UI/Card';
import { Palette, Layout, Type, Laptop, Moon, Sun, Monitor, Check, Upload, Globe, Save } from 'lucide-react';

export function AppearanceSettings() {
  const { state, dispatch } = useApp();
  const { appSettings } = state;
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const branding = appSettings.brandingSettings || {
    companyName: 'Mon Entreprise',
    primaryColor: '#3B82F6',
    sidebarTheme: 'glass',
    welcomeMessage: 'Bienvenue dans votre espace projet'
  };

  const [localBranding, setLocalBranding] = useState(branding);

  const accentColors = [
    { name: 'Bleu', class: 'bg-blue-500', value: 'blue' },
    { name: 'Indigo', class: 'bg-indigo-500', value: 'indigo' },
    { name: 'Violet', class: 'bg-purple-500', value: 'purple' },
    { name: 'Rose', class: 'bg-pink-500', value: 'pink' },
    { name: 'Rouge', class: 'bg-red-500', value: 'red' },
    { name: 'Orange', class: 'bg-orange-500', value: 'orange' },
    { name: 'Jaune', class: 'bg-yellow-500', value: 'yellow' },
    { name: 'Vert', class: 'bg-green-500', value: 'green' },
    { name: 'Émeraude', class: 'bg-emerald-500', value: 'emerald' },
    { name: 'Teal', class: 'bg-teal-500', value: 'teal' },
    { name: 'Cyan', class: 'bg-cyan-500', value: 'cyan' },
  ];

  const handleUpdateBranding = (updates: any) => {
    const newBranding = { ...localBranding, ...updates };
    setLocalBranding(newBranding);
    dispatch({ type: 'UPDATE_BRANDING', payload: updates });
    showFeedback();
  };

  const showFeedback = () => {
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  return (
    <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Feedback de sauvegarde */}
      {showSavedFeedback && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right-2 fade-in duration-300">
          <Save className="w-4 h-4" />
          <span className="text-sm font-medium">Paramètres sauvegardés</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Apparence Personnalisée</h2>
          <p className="text-gray-500 dark:text-gray-400">Personnalisez l'interface de votre projet pour vous et vos clients.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne de gauche - Paramètres */}
        <div className="lg:col-span-2 space-y-8">

          {/* Section Thème Global */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Laptop className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-sm">Thème de l'application</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  dispatch({ type: 'SET_THEME', payload: 'light' });
                  showFeedback();
                }}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-3 ${state.theme === 'light'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                  }`}
              >
                <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                  <Sun className="w-6 h-6" />
                </div>
                <span className="font-medium dark:text-white">Clair</span>
              </button>

              <button
                onClick={() => {
                  dispatch({ type: 'SET_THEME', payload: 'dark' });
                  showFeedback();
                }}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-3 ${state.theme === 'dark'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                  }`}
              >
                <div className="p-2 rounded-lg bg-gray-800 text-white">
                  <Moon className="w-6 h-6" />
                </div>
                <span className="font-medium dark:text-white">Sombre</span>
              </button>

              <button
                className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 opacity-50 cursor-not-allowed flex flex-col items-center space-y-3"
              >
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
                  <Monitor className="w-6 h-6" />
                </div>
                <span className="font-medium dark:text-white">Auto (Système)</span>
              </button>
            </div>
          </section>

          {/* Section Couleur d'accent */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Palette className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-sm">Couleur d'accentuation</h3>
            </div>
            <Card className="p-6">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-3">
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      dispatch({ type: 'SET_ACCENT_COLOR', payload: color.value });
                      showFeedback();
                    }}
                    className={`group relative w-full aspect-square rounded-full ${color.class} shadow-lg transition-transform hover:scale-110 active:scale-95 flex items-center justify-center`}
                    title={color.name}
                  >
                    {state.appSettings.accentColor === color.value && (
                      <Check className="w-5 h-5 text-white animate-in zoom-in duration-200" />
                    )}
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap dark:text-gray-300">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </section>

          {/* Section Branding Client */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-sm">Branding & Logo Client</h3>
            </div>
            <Card className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom de l'entreprise</label>
                  <input
                    type="text"
                    value={localBranding.companyName}
                    onChange={(e) => handleUpdateBranding({ companyName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    placeholder="Ex: Ma Super Agence"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message de bienvenue</label>
                  <input
                    type="text"
                    value={localBranding.welcomeMessage}
                    onChange={(e) => handleUpdateBranding({ welcomeMessage: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    placeholder="Ex: Bienvenue dans votre portail"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo de l'interface (URL)</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={localBranding.logo || ''}
                      onChange={(e) => handleUpdateBranding({ logo: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                      placeholder="https://votre-site.com/logo.png"
                    />
                  </div>
                  <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors flex items-center space-x-2 font-medium">
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Uploader</span>
                  </button>
                </div>
              </div>
            </Card>
          </section>

          {/* Section Typographie */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Type className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-sm">Typographie & Taille</h3>
            </div>
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="flex-1 w-full space-y-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Taille de police globale</label>
                  <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-700 rounded-xl w-full max-w-sm">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          dispatch({ type: 'UPDATE_APP_SETTINGS', payload: { fontSize: size } });
                          showFeedback();
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${appSettings.fontSize === size
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                          }`}
                      >
                        {size === 'small' ? 'Petit' : size === 'medium' ? 'Normal' : 'Grand'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 w-full space-y-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Style de police</label>
                  <select
                    value={appSettings.fontFamily || 'Inter'}
                    onChange={(e) => {
                      dispatch({ type: 'UPDATE_APP_SETTINGS', payload: { fontFamily: e.target.value } });
                      showFeedback();
                    }}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  >
                    <option value="Inter">Inter (Système)</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Outfit">Outfit</option>
                    <option value="Sora">Sora</option>
                    <option value="Public Sans">Public Sans</option>
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                  </select>
                </div>
              </div>
            </Card>
          </section>
        </div>

        {/* Colonne de droite - Preview */}
        <div className="space-y-6">
          <div className="sticky top-24 block">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-4">
              <Layout className="w-5 h-5" />
              <h3 className="font-semibold uppercase tracking-wider text-sm">Aperçu en direct</h3>
            </div>
            <Card className="overflow-hidden border-2 border-blue-500/30">
              <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {localBranding.logo ? (
                    <img src={localBranding.logo} alt="Logo" className="h-6 object-contain" />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-blue-500" />
                  )}
                  <span className="font-bold text-sm dark:text-white">{localBranding.companyName}</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
              </div>
              <div className="p-4 h-[300px] flex">
                <aside className="w-20 border-r border-gray-100 dark:border-gray-800 pr-4 space-y-3">
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-2 w-3/4 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-2 w-1/2 bg-gray-100 dark:bg-gray-800 rounded" />
                </aside>
                <main className="flex-1 p-4 space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400">{localBranding.welcomeMessage}</h4>
                    <div className="h-10 w-full rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-8">
                    <div className="h-20 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="h-20 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800" />
                  </div>
                  <button className={`w-full py-2 rounded-lg text-white font-medium text-xs bg-${appSettings.accentColor}-500 shadow-lg shadow-${appSettings.accentColor}-500/20`}>
                    Bouton Accentué
                  </button>
                </main>
              </div>
            </Card>
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400 italic">
              Note : L'aperçu simule l'interface client. Les changements sont sauvegardés automatiquement.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
