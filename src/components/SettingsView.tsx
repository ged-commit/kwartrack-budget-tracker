import { useState, useRef } from 'react';
import { ChevronRight, Bell, Moon, Globe, CreditCard, Key, RefreshCcw, LogOut, Check, Pencil, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, Transaction, exportData, importData, exportCSV } from '@/lib/store';

interface Props {
  settings: AppSettings;
  transactions: Transaction[];
  onUpdateSettings: (settings: AppSettings) => void;
  onReload: () => void;
  onBack: () => void;
}

export default function SettingsView({ settings, transactions, onUpdateSettings, onReload, onBack }: Props) {
  const [message, setMessage] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleTheme = () => {
    onUpdateSettings({ ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importData(ev.target?.result as string);
        setMessage('Data restored successfully!');
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        setMessage('Failed to import.');
      }
    };
    reader.readAsText(file);
  };

  const SettingRow = ({ icon: Icon, label, value, onClick, subValue, isToggle, toggleState }: any) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-4 group active:opacity-60 transition-all border-b border-border/50 last:border-0"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          <Icon size={20} />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {subValue && <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Value: {subValue}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isToggle ? (
          <div className={`w-12 h-6 rounded-full transition-colors relative ${toggleState ? 'bg-primary' : 'bg-muted'}`}>
            <motion.div
              animate={{ x: toggleState ? 24 : 2 }}
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </div>
        ) : (
          <>
            {value && <span className="text-sm text-muted-foreground">{value}</span>}
            <ChevronRight size={18} className="text-muted-foreground/50" />
          </>
        )}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-30">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-bold">Profile</h1>
        <button
          onClick={() => setIsEditingName(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-foreground"
        >
          <Pencil size={20} />
        </button>
      </div>

      <div className="px-6 space-y-8 mt-6 max-w-lg mx-auto">
        {/* Profile Info */}
        <div className="text-center space-y-2 py-4">
          <div className="space-y-1">
            {isEditingName ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  autoFocus
                  className="bg-muted px-4 py-2 rounded-xl text-xl font-bold text-center outline-none border border-primary/50"
                  value={settings.userName}
                  onChange={(e) => onUpdateSettings({ ...settings, userName: e.target.value })}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                />
                <button onClick={() => setIsEditingName(false)} className="text-primary"><Check size={20} /></button>
              </div>
            ) : (
              <h2 className="text-2xl font-black text-foreground" onClick={() => setIsEditingName(true)}>
                {settings.userName || 'Kwartrack User'}
              </h2>
            )}
            <p className="text-sm text-muted-foreground">user_{settings.userName.toLowerCase().replace(/\s+/g, '_') || 'id'}@kwartrack.com</p>
          </div>
        </div>

        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-2">General settings</h3>
          <div className="bg-card rounded-[2.5rem] p-4 shadow-sm border border-border/50">
            <SettingRow
              icon={Globe}
              label="Language"
              value="English"
              onClick={() => { }}
            />
            <SettingRow
              icon={Moon}
              label="Theme"
              isToggle={true}
              toggleState={settings.theme === 'dark'}
              onClick={toggleTheme}
            />
          </div>
        </div>

        {/* Custom Application Settings */}
        <div className="space-y-4 pt-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-2">In-app Settings</h3>
          <div className="bg-card rounded-[2.5rem] p-4 shadow-sm border border-border/50">
            <div className="py-2 space-y-6">
              <div className="px-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-3 block">Payday Cycle</label>
                <div className="flex bg-background p-1.5 rounded-2xl mb-4">
                  {(['weekly', 'monthly'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => onUpdateSettings({ ...settings, paydayType: type, paydayValue: type === 'weekly' ? 5 : 15 })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black capitalize transition-all ${settings.paydayType === type ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Sub-selection for Payday */}
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] text-muted-foreground block mb-3 uppercase tracking-wider font-bold">
                    {settings.paydayType === 'weekly' ? 'Select Day' : 'Enter Date (1-31)'}
                  </label>
                  {settings.paydayType === 'weekly' ? (
                    <div className="grid grid-cols-7 gap-1.5">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <button
                          key={i}
                          onClick={() => onUpdateSettings({ ...settings, paydayValue: i })}
                          className={`aspect-square rounded-lg text-[10px] font-black transition-all ${settings.paydayValue === i ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                            }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={settings.paydayValue}
                      onChange={e => onUpdateSettings({ ...settings, paydayValue: parseInt(e.target.value) || 15 })}
                      className="w-full py-4 px-4 rounded-2xl bg-background text-foreground text-sm font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  )}
                </div>
              </div>

              <div className="px-2 pt-2 border-t border-border/30">
                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-3 block">Weekly Budget</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-primary font-bold">₱</div>
                  <input
                    type="number"
                    value={settings.weeklyBudget}
                    onChange={e => onUpdateSettings({ ...settings, weeklyBudget: parseInt(e.target.value) || 0 })}
                    className="w-full bg-background rounded-2xl py-4 pl-10 pr-4 font-black text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Persistence */}
        <div className="flex gap-4 pt-4 pb-8">
          <button
            onClick={() => {
              const blob = new Blob([exportData()], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'kwartrack_backup.json'; a.click();
            }}
            className="flex-1 py-4 rounded-[2rem] bg-card border border-border text-foreground font-black text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard size={18} className="text-primary" />
            Backup
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 py-4 rounded-[2rem] bg-card border border-border text-foreground font-black text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} className="text-primary" />
            Restore
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 bg-primary text-primary-foreground rounded-full shadow-2xl font-bold text-sm z-50"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
