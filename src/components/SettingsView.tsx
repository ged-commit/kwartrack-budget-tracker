import { useState, useRef } from 'react';
import { 
  ChevronRight, Bell, Moon, Globe, CreditCard, Key, RefreshCcw, 
  LogOut, Check, Pencil, ArrowLeft, ShieldCheck, Wallet, 
  Monitor, Lock, ExternalLink, Sparkles, User, Info, ChevronLeft
} from 'lucide-react';
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
    <div className="w-full px-8 pt-4 pb-28 space-y-10">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-end justify-between mb-12 border-b border-foreground/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
            <h1 className="font-display text-2xl font-black text-foreground tracking-tighter">Settings</h1>
          </div>
          <p className="text-muted-foreground font-medium text-[11px] opacity-60 uppercase tracking-widest leading-loose">Configure your Kwartrack experience and data</p>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:hidden mb-8">
        {onBack && (
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground">
            <ChevronLeft size={20} />
          </button>
        )}
        <h1 className="font-display text-2xl font-black text-foreground">Account Settings</h1>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Profile / Priority Settings */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-liquid p-8 rounded-[3rem] relative overflow-hidden group border border-white/5 shadow-2xl">
            <div className="relative z-10 text-center">
              <div className="w-32 h-32 mx-auto rounded-[2.5rem] bg-foreground/5 p-2 mb-6 relative group/avatar">
                  <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-black/50 flex items-center justify-center text-4xl font-black text-foreground/80 overflow-hidden shadow-inner relative z-10">
                    {settings?.userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="absolute inset-0 bg-primary/20 scale-110 blur-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                {isEditingName ? (
                  <input
                    autoFocus
                    className="bg-muted px-4 py-1 rounded-xl text-xl font-bold text-center outline-none border border-primary/50 w-full"
                    value={settings.userName}
                    onChange={(e) => onUpdateSettings({ ...settings, userName: e.target.value })}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  />
                ) : (
                  <span onClick={() => setIsEditingName(true)} className="cursor-pointer hover:text-primary transition-colors">
                    {settings.userName || 'Kwartrack User'}
                  </span>
                )}
              </h2>
              <p className="text-sm font-medium text-muted-foreground mb-8">user_{(settings.userName || 'user').toLowerCase().replace(/\s+/g, '_')}@kwartrack.com</p>
              
              <button 
                onClick={() => setIsEditingName(true)}
                className="w-full py-4 rounded-2xl bg-foreground text-background font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-foreground/5"
              >
                Edit Profile
              </button>
            </div>
            
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
          </div>

          <div className="p-6 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex items-center gap-5 group transition-colors hover:bg-primary/10">
             <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
               <ShieldCheck size={28} />
             </div>
             <div>
               <p className="text-sm font-bold text-foreground">Verified Member</p>
               <p className="text-[10px] uppercase font-black tracking-widest text-primary/60">Secure Account Active</p>
             </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="lg:col-span-8 mt-12 lg:mt-0 lg:grid lg:grid-cols-2 lg:gap-8 space-y-8 lg:space-y-0">
          
          {/* Categorized Settings */}
          <div className="glass-liquid p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden flex flex-col justify-between group transition-all hover:bg-white/[0.03]">
             <div>
                <div className="flex items-center gap-3 mb-8">
                   <div className="p-2.5 rounded-xl bg-foreground/5 text-muted-foreground group-hover:text-foreground transition-colors">
                     <Wallet size={20} />
                   </div>
                   <h3 className="font-display font-bold text-foreground">Financial Setup</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Budgeting Cycle</label>
                    <div className="flex bg-foreground/5 p-1 rounded-2xl">
                      {(['weekly', 'monthly'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => onUpdateSettings({ ...settings, paydayType: type, paydayValue: type === 'weekly' ? 5 : 15 })}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black capitalize transition-all ${settings.paydayType === type ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Weekly Budget</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">₱</span>
                      <input
                        type="number"
                        value={settings.weeklyBudget}
                        onChange={e => onUpdateSettings({ ...settings, weeklyBudget: parseInt(e.target.value) || 0 })}
                        className="w-full bg-foreground/5 rounded-2xl py-3.5 pl-10 pr-4 font-bold text-foreground outline-none border border-transparent focus:border-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
             </div>
          </div>

          <div className="glass-liquid p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden flex flex-col justify-between group transition-all hover:bg-white/[0.03]">
             <div>
                <div className="flex items-center gap-3 mb-8">
                   <div className="p-2.5 rounded-xl bg-foreground/5 text-muted-foreground group-hover:text-foreground transition-colors">
                     <Monitor size={20} />
                   </div>
                   <h3 className="font-display font-bold text-foreground">Preferences</h3>
                </div>
                
                <div className="space-y-6">
                  <button onClick={toggleTheme} className="w-full flex justify-between items-center group/btn">
                    <div className="flex items-center gap-3">
                      <Moon size={18} className="text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground group-hover/btn:text-foreground transition-colors">Dark Mode</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.theme === 'dark' ? 'bg-primary' : 'bg-zinc-700'}`}>
                      <motion.div animate={{ x: settings.theme === 'dark' ? 26 : 2 }} className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </button>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Globe size={18} className="text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">Language</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-primary">English</span>
                  </div>
                </div>
             </div>
          </div>

          {/* Backup & Restore Section */}
          <div className="lg:col-span-2 glass-frosted p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row gap-6">
            <button
              onClick={() => {
                const blob = new Blob([exportData()], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'kwartrack_backup.json'; a.click();
              }}
              className="flex-1 py-4 rounded-2xl bg-foreground/5 border border-white/5 text-foreground font-bold text-sm hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"
            >
              <CreditCard size={18} className="text-primary" /> Backup Local Ledger
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 py-4 rounded-2xl bg-foreground/5 border border-white/5 text-foreground font-bold text-sm hover:bg-foreground/10 transition-all flex items-center justify-center gap-3"
            >
              <RefreshCcw size={18} className="text-primary" /> Import Backup
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>

          {/* Danger Zone */}
          <div className="lg:col-span-2 p-10 rounded-[3rem] border border-rose-500/10 bg-rose-500/5 relative overflow-hidden mt-4 group">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="font-display text-xl font-bold text-rose-500 mb-2">Destructive Actions</h3>
                <p className="text-sm text-zinc-500 font-medium max-w-md">Once you delete your local data, there is no going back. Please be certain of this action.</p>
              </div>
              <button 
                onClick={() => { if(confirm('Delete everything?')) onReload(); }} 
                className="px-10 py-4 rounded-2xl bg-rose-900/20 text-rose-500 font-black text-[11px] uppercase tracking-[0.2em] border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-900/10 active:scale-95"
              >
                Reset All Local Data
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[60px]" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 px-8 py-4 bg-primary text-primary-foreground rounded-full shadow-2xl font-black text-xs uppercase tracking-widest z-50"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

