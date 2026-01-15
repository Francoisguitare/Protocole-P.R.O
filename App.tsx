import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from './components/Icon';
import { AppState, PlanStep } from './types';
import { ADMIN_CODE, STORAGE_KEY } from './constants';

const INITIAL_STATE: AppState = {
  studentName: '',
  segment: '',
  bpmZero: '',
  bpmRupture: '',
  plan: [],
  isPlanGenerated: false,
  isAdmin: false,
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const generatePlan = () => {
    const zero = parseInt(state.bpmZero);
    const rupture = parseInt(state.bpmRupture);

    if (isNaN(zero) || isNaN(rupture) || !state.studentName || !state.segment) {
      alert("Veuillez remplir tous les champs correctement.");
      return;
    }

    const gap = rupture - zero;
    const durationDays = gap > 20 ? 10 : 7;
    
    const newPlan: PlanStep[] = [];

    // Etape 1: Validation Point Zéro
    newPlan.push({
      id: 'step-zero',
      type: 'validation',
      label: 'Validation Point Zéro (100% Propre)',
      bpm: zero,
      completed: false,
    });

    // Etape 2: Validation Point Rupture
    newPlan.push({
      id: 'step-rupture',
      type: 'validation',
      label: 'Validation Point de Rupture (Crash Test)',
      bpm: rupture,
      completed: false,
    });

    // Progression Lineaire
    for (let i = 1; i <= durationDays; i++) {
      // Linear interpolation: Zero + (Gap * (CurrentDay / TotalDays))
      // We map day 1 to a small increment and day N to Rupture (or close to it)
      // Standard linear progression from Zero to Rupture over durationDays
      const progress = i / durationDays;
      const targetBpm = Math.round(zero + (gap * progress));
      
      newPlan.push({
        id: `day-${i}`,
        type: 'progression',
        label: `Jour ${i} : Progression`,
        bpm: targetBpm,
        completed: false,
        dayIndex: i
      });
    }

    // Phase Optimisation
    newPlan.push({
      id: 'step-opti',
      type: 'optimisation',
      label: 'Phase d\'Optimisation & Réintégration',
      completed: false,
    });

    setState(prev => ({ ...prev, plan: newPlan, isPlanGenerated: true }));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminInput === ADMIN_CODE) {
      setState(prev => ({ ...prev, isAdmin: true }));
      setShowAdminInput(false);
      setAdminInput('');
    } else {
      alert("Code incorrect.");
    }
  };

  const toggleAdminMode = () => {
    if (state.isAdmin) {
      setState(prev => ({ ...prev, isAdmin: false }));
    } else {
      setShowAdminInput(true);
    }
  };

  const toggleStep = (id: string) => {
    // Only allow toggling if admin mode is active
    if (!state.isAdmin) {
      // Shake animation or visual feedback could go here
      return;
    }

    setState(prev => ({
      ...prev,
      plan: prev.plan.map(step => 
        step.id === id ? { ...step, completed: !step.completed } : step
      )
    }));
  };

  const resetApp = () => {
    if (confirm("Attention : Cela effacera toute la progression actuelle. Continuer ?")) {
      setState({ ...INITIAL_STATE, isAdmin: state.isAdmin }); // Keep admin status if logged in
    }
  };

  const getWhatsAppLink = (step: PlanStep) => {
    const bpmText = step.bpm ? ` à ${step.bpm} BPM` : '';
    const text = `Salut François, voici ma vidéo pour l'étape : ${step.label}${bpmText}. (Élève: ${state.studentName}, Segment: ${state.segment})`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-300 font-sans selection:bg-gold-500 selection:text-black pb-20">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center shadow-lg shadow-gold-500/20">
              <span className="font-mono font-bold text-black text-lg">GIA</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide uppercase">Le Verrou P.R.O.</h1>
              {state.studentName && <p className="text-xs text-gold-500 font-mono">{state.studentName}</p>}
            </div>
          </div>
          {state.isAdmin && (
            <div className="px-2 py-1 bg-gold-500/10 border border-gold-500/20 rounded text-xs text-gold-500 font-mono flex items-center gap-1">
              <Icons.Shield size={12} /> ADMIN
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8">
        
        {/* Phase 1: Calibration */}
        {!state.isPlanGenerated ? (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Icons.Activity className="text-gold-500" /> Calibration
              </h2>
              <p className="text-sm text-gray-500">Configurez les paramètres de votre session de travail.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400 uppercase">Nom de l'élève</label>
                <input
                  type="text"
                  value={state.studentName}
                  onChange={(e) => setState(prev => ({ ...prev, studentName: e.target.value }))}
                  placeholder="ex: Jean Dupont"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all placeholder:text-neutral-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-400 uppercase">Segment à travailler</label>
                <input
                  type="text"
                  value={state.segment}
                  onChange={(e) => setState(prev => ({ ...prev, segment: e.target.value }))}
                  placeholder="ex: Mesure 6 (temps 4) -> Mesure 7"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all placeholder:text-neutral-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400 uppercase">Point Zéro (BPM)</label>
                  <input
                    type="number"
                    value={state.bpmZero}
                    onChange={(e) => setState(prev => ({ ...prev, bpmZero: e.target.value }))}
                    placeholder="100%"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all placeholder:text-neutral-700 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400 uppercase">Rupture (BPM)</label>
                  <input
                    type="number"
                    value={state.bpmRupture}
                    onChange={(e) => setState(prev => ({ ...prev, bpmRupture: e.target.value }))}
                    placeholder="80%"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all placeholder:text-neutral-700 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={generatePlan}
                className="w-full mt-6 bg-white text-black font-bold py-4 rounded-lg hover:bg-gold-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/5 active:scale-95 transform duration-100"
              >
                <Icons.Activity size={20} />
                GÉNÉRER MON PLAN
              </button>
            </div>
          </div>
        ) : (
          /* Phase 2: Plan de Validation */
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-end justify-between mb-2">
               <div>
                  <h2 className="text-xl font-bold text-white">Protocole Actif</h2>
                  <p className="text-xs text-gold-500 font-mono mt-1">
                    {state.bpmZero} BPM <span className="text-gray-600 mx-1">→</span> {state.bpmRupture} BPM
                  </p>
               </div>
               <button onClick={resetApp} className="text-neutral-600 hover:text-red-500 transition-colors p-2">
                 <Icons.Reset size={18} />
               </button>
            </div>

            <div className="space-y-3 relative">
              {/* Connecting line background */}
              <div className="absolute left-[1.65rem] top-4 bottom-4 w-px bg-neutral-800 -z-10"></div>

              {state.plan.map((step, index) => {
                const isLocked = !step.completed && !state.isAdmin;
                // Previous step must be completed to "enable" the WhatsApp button logically (though buttons are always clickable to send video)
                // Visually, we highlight the current active step
                const previousStep = state.plan[index - 1];
                const isActive = !step.completed && (!previousStep || previousStep.completed);
                const isFuture = !step.completed && !isActive;

                return (
                  <div 
                    key={step.id} 
                    className={`
                      relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300
                      ${step.completed 
                        ? 'bg-neutral-900/30 border-gold-500/30' 
                        : isActive 
                          ? 'bg-neutral-900 border-neutral-700 shadow-md shadow-black/50' 
                          : 'bg-neutral-900/20 border-neutral-800 opacity-60 grayscale'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox Mechanism */}
                      <button
                        onClick={() => toggleStep(step.id)}
                        disabled={!state.isAdmin}
                        className={`
                          mt-1 flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-all
                          ${step.completed 
                            ? 'bg-gold-500 border-gold-500 text-black' 
                            : state.isAdmin 
                              ? 'bg-neutral-800 border-neutral-600 hover:border-gold-500 cursor-pointer' 
                              : 'bg-neutral-900 border-neutral-800 cursor-not-allowed'
                          }
                        `}
                      >
                        {step.completed && <Icons.Check size={14} strokeWidth={4} />}
                        {!step.completed && state.isAdmin && <div className="w-full h-full rounded hover:bg-white/10" />}
                      </button>

                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-medium ${step.completed ? 'text-gold-500' : 'text-gray-200'}`}>
                            {step.label}
                          </h3>
                          {step.bpm && (
                             <span className="font-mono text-xs font-bold text-neutral-500 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                               {step.bpm}
                             </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                           <span className={`text-xs ${isActive ? 'text-gold-500/80 animate-pulse' : 'text-neutral-600'}`}>
                              {step.completed ? 'Validé par Instructeur' : isActive ? 'En attente de validation' : 'Verrouillé'}
                           </span>

                           <a 
                             href={getWhatsAppLink(step)}
                             target="_blank"
                             rel="noopener noreferrer"
                             className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                                ${step.completed
                                  ? 'hidden'
                                  : 'bg-[#25D366] text-black hover:bg-[#1fb855] hover:scale-105 shadow-lg shadow-green-900/20'
                                }
                             `}
                           >
                             <Icons.Send size={12} />
                             Envoyer Vidéo
                           </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {state.plan.every(s => s.completed) && (
                <div className="p-6 bg-gradient-to-br from-gold-500/20 to-neutral-900 border border-gold-500/50 rounded-xl text-center animate-bounce-in">
                    <Icons.Music className="w-12 h-12 text-gold-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Protocole Terminé !</h3>
                    <p className="text-sm text-gray-300">Le verrou est levé. Vous pouvez réintégrer le segment dans la phrase complète.</p>
                </div>
            )}
          </div>
        )}
      </main>

      {/* Admin Toggle Footer */}
      <footer className="fixed bottom-0 left-0 w-full p-4 flex justify-center pointer-events-none">
        <button 
          onClick={toggleAdminMode}
          className={`
            pointer-events-auto px-4 py-2 rounded-full text-[10px] tracking-widest uppercase font-bold transition-all
            ${state.isAdmin 
              ? 'bg-red-900/20 text-red-500 hover:bg-red-900/40' 
              : 'text-neutral-800 hover:text-neutral-600'
            }
          `}
        >
          {state.isAdmin ? 'Quitter Mode Admin' : 'Mode Admin'}
        </button>
      </footer>

      {/* Admin Login Modal */}
      {showAdminInput && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Icons.Lock size={18} className="text-gold-500" />
                Déverrouillage
              </h3>
              <button onClick={() => setShowAdminInput(false)} className="text-neutral-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="password"
                autoFocus
                value={adminInput}
                onChange={(e) => setAdminInput(e.target.value)}
                placeholder="Code Instructeur..."
                className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-gold-500 focus:outline-none text-center tracking-widest font-mono"
              />
              <button 
                type="submit"
                className="w-full bg-gold-500 text-black font-bold py-3 rounded-lg hover:bg-gold-400 transition-colors"
              >
                ACCÉDER
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
