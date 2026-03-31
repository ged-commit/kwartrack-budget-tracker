import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Plus, Banknote, Landmark, Trash2, Settings as SettingsIcon, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Transaction, AppSettings, formatCurrency, generateId } from '@/lib/store';
import { useHaptics } from '@/hooks/useHaptics';
import TransactionTable from './TransactionTable';
import logo from '@/assets/kwartrack-logo.png';
import squireeImg from '@/assets/squiree-mascot-wallet.png';
import gcashLogo from '../assets/gcash-official.png';
import mayaLogo from '../assets/maya-official.png';
import gotymeLogo from '../assets/gotyme-official.png';

interface WalletViewProps {
  transactions: Transaction[];
  settings: AppSettings;
  wallets: Wallet[];
  onUpdateWallets: (wallets: Wallet[]) => void;
  onAddIncome: () => void;
  onSettingsClick: () => void;
}

const typeIcons: Record<string, any> = {
  cash: Banknote,
  'physical bank': Landmark,
  'online bank': Smartphone,
};

const providerLogos: Record<string, string> = {
  gcash: gcashLogo,
  maya: mayaLogo,
  gotyme: gotymeLogo,
};

// Stack depth config: relative position → visual properties (Mobile Vertical)
function getStackConfig(rel: number) {
  // Shifting the entire stack down to prevent overlap with the Action Buttons
  if (rel === 0) return { scale: 1.0, y: 40, opacity: 1, zIndex: 10, shadow: '0 12px 40px rgba(0,0,0,0.18)' };
  if (rel === -1) return { scale: 0.88, y: -50, opacity: 0.72, zIndex: 7, shadow: 'none' };
  if (rel === -2) return { scale: 0.78, y: -130, opacity: 0.45, zIndex: 5, shadow: 'none' };
  if (rel === 1) return { scale: 0.90, y: 150, opacity: 0.70, zIndex: 7, shadow: 'none' };
  if (rel === 2) return { scale: 0.80, y: 240, opacity: 0.40, zIndex: 5, shadow: 'none' };
  return { scale: 0.75, y: rel > 0 ? 900 : -900, opacity: 0, zIndex: 1, shadow: 'none' };
}

const CARD_W = 340;
const GAP = 32;

// Stack depth config: relative position → visual properties (Desktop Horizontal)
function getDesktopStackConfig(rel: number) {
  const CARD_STACKED_W = CARD_W * 0.72;

  if (rel === 0) return { x: 0, scale: 1.0, opacity: 1, zIndex: 10, shadow: '0 16px 48px rgba(0,0,0,0.22)' };
  if (rel === -1) return { x: -(CARD_STACKED_W + GAP), scale: 0.88, opacity: 0.72, zIndex: 7, shadow: 'none' };
  if (rel === -2) return { x: -(CARD_STACKED_W + GAP) * 1.7, scale: 0.76, opacity: 0.42, zIndex: 5, shadow: 'none' };
  if (rel === 1) return { x: (CARD_STACKED_W + GAP), scale: 0.88, opacity: 0.72, zIndex: 7, shadow: 'none' };
  if (rel === 2) return { x: (CARD_STACKED_W + GAP) * 1.7, scale: 0.76, opacity: 0.42, zIndex: 5, shadow: 'none' };
  return { x: rel > 0 ? 1200 : -1200, scale: 0.65, opacity: 0, zIndex: 1, shadow: 'none' };
}

export default function WalletView({
  transactions, settings, wallets, onUpdateWallets, onAddIncome, onSettingsClick
}: WalletViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'cash' | 'physical bank' | 'online bank'>('physical bank');
  const [newProvider, setNewProvider] = useState<'gcash' | 'maya' | 'gotyme' | 'none'>('none');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const { impact, selection } = useHaptics();
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchStartPos = useRef<number | null>(null);
  const wheelLock = useRef(false);

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const total = wallets.length;

  const selectedWallet = wallets[activeIdx];
  const walletTransactions = useMemo(() => {
    if (!selectedWallet) return [];
    return transactions.filter(t => t.walletId === selectedWallet.id).reverse();
  }, [transactions, selectedWallet]);

  const isDark = settings.theme === 'dark';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const goTo = useCallback((idx: number) => {
    setActiveIdx(Math.max(0, Math.min(idx, total - 1)));
    impact();
  }, [total, impact]);

  // Keep active index in bounds if wallets change
  useEffect(() => {
    setActiveIdx(i => Math.max(0, Math.min(i, Math.max(0, wallets.length - 1))));
  }, [wallets.length]);

  // Mouse wheel
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      setTimeout(() => { wheelLock.current = false; }, 600);
      goTo(activeIdx + (e.deltaY > 0 ? 1 : -1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [activeIdx, goTo]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartPos.current === null) return;
    const currentPos = e.changedTouches[0].clientX;
    const diff = touchStartPos.current - currentPos;
    if (Math.abs(diff) > 40) goTo(activeIdx + (diff > 0 ? 1 : -1));
    touchStartPos.current = null;
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const icons: Record<string, string> = { cash: '💵', 'physical bank': '🏦', 'online bank': '📱' };
    onUpdateWallets([...wallets, {
      id: generateId(),
      name: newName.trim(),
      type: newType as any,
      balance: 0,
      icon: icons[newType as any],
      provider: newType === 'online bank' ? (newProvider as any) : 'none',
    }]);
    setNewName('');
    setShowAdd(false);
  };

  const handleDeleteWallet = (id: string) => {
    onUpdateWallets(wallets.filter(w => w.id !== id));
  };

  const handleUpdateWallet = (id: string, updates: Partial<Wallet>) => {
    onUpdateWallets(wallets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>

      {/* ---------------- MOBILE LAYOUT ---------------- */}
      <div className="lg:hidden pt-8 pb-48 space-y-6 w-full px-8">
        <div className="flex justify-between items-center px-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground">Accounts</h1>
            <p className="text-sm text-muted-foreground">Manage your accounts and money.</p>
          </div>
        </div>

        {/* Stack Viewer (Mobile Horizontal) */}
        <div className="mt-8 flex flex-col items-center gap-6 w-full">
          {wallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground/40 gap-3">
              <Landmark size={48} strokeWidth={1} />
              <p className="text-sm font-medium">No accounts yet. Add one above.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              <div
                ref={viewportRef}
                className="relative select-none w-full touch-pan-y"
                style={{ height: 260 }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {wallets.map((w, i) => {
                  const rel = i - activeIdx;
                  const cfg = getDesktopStackConfig(rel);
                  const Icon = typeIcons[w.type] || Smartphone;
                  const providerLogo = w.provider && w.provider !== 'none' ? providerLogos[w.provider] : null;

                  return (
                    <div
                      key={w.id}
                      onClick={() => i !== activeIdx && !isDeleteMode && !isManageMode && goTo(i)}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: 310,
                        transform: `translateX(calc(-50% + ${cfg.x}px)) translateY(-50%) scale(${cfg.scale})`,
                        opacity: cfg.opacity,
                        zIndex: cfg.zIndex,
                        boxShadow: cfg.shadow,
                        transformOrigin: 'center center',
                        willChange: 'transform, opacity',
                        transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.6s',
                        borderRadius: 24,
                        cursor: i !== activeIdx ? 'pointer' : 'default',
                        overflow: 'hidden',
                      }}
                      className={`glass-frosted border border-border min-h-[190px] flex flex-col ${isDeleteMode ? 'border-rose-500/40 ring-1 ring-rose-500/20' : ''}`}
                    >
                      {/* Card Header */}
                      <div className="card-header shrink-0 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                            <Icon {...(w.type === 'physical bank' ? {} : { size: 28 })} className={w.type === 'physical bank' ? '' : 'text-white'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            {isManageMode && i === activeIdx ? (
                              <input
                                type="text"
                                value={w.name}
                                onClick={(e) => e.stopPropagation()}
                                onChange={e => handleUpdateWallet(w.id, { name: e.target.value })}
                                className="w-full bg-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white outline-none border border-white/20 focus:bg-white/20"
                              />
                            ) : (
                              <p className="text-base font-bold text-white truncate">{w.name}</p>
                            )}
                            <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em]">{w.type}</p>
                          </div>
                        </div>
                        {isDeleteMode && i === activeIdx && (
                          <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteWallet(w.id); }}
                            className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center border border-white/20 text-white shadow-xl hover:scale-110 transition-transform"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-7 pt-5 flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-end mt-8">
                          <div className="flex flex-col">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 mb-1.5">Available Balance</p>
                            {isManageMode && i === activeIdx ? (
                              <div
                                className="flex items-center gap-1.5 bg-foreground/5 rounded-xl px-3 py-1.5 border border-foreground/10 focus-within:border-primary/50 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="text-xs font-bold text-primary">₱</span>
                                <input
                                  type="number"
                                  value={w.balance}
                                  onChange={e => handleUpdateWallet(w.id, { balance: parseFloat(e.target.value) || 0 })}
                                  className="w-28 bg-transparent text-base font-bold text-foreground outline-none tabular-nums"
                                />
                              </div>
                            ) : (
                              <p className="font-display text-3xl font-bold text-foreground tabular-nums tracking-tight">
                                {formatCurrency(w.balance)}
                              </p>
                            )}
                          </div>
                          {providerLogo && (
                            <div className="flex items-center justify-center px-2">
                              <img
                                src={providerLogo}
                                alt=""
                                className={`h-8 w-auto object-contain brightness-110 ${w.provider !== 'gcash' ? 'mix-blend-multiply' : ''}`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons (Mobile) - Moved below stack */}
        <div className="grid grid-cols-3 gap-6 pt-6 px-4">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => { impact(); setShowAdd(true); setNewProvider('none'); }}
              className="w-16 h-16 glass-button rounded-2xl group hover:scale-105 transition-all shadow-lg min-h-0"
            >
              <Plus size={24} className="text-foreground group-hover:scale-110 transition-transform" />
            </button>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] opacity-60">New</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => { impact(); setIsDeleteMode(!isDeleteMode); setIsManageMode(false); }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 min-h-0 ${isDeleteMode ? 'bg-rose-500/20 border-rose-500/50 shadow-rose-500/20 shadow-lg' : 'glass-button hover:scale-105'}`}
            >
              <Trash2 size={24} className={isDeleteMode ? 'text-rose-400' : 'text-foreground/60'} />
            </button>
            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${isDeleteMode ? 'text-rose-400' : 'text-muted-foreground opacity-60'}`}>Remove</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => { impact(); setIsManageMode(!isManageMode); setIsDeleteMode(false); }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 min-h-0 ${isManageMode ? 'bg-amber-500/20 border-amber-500/50 shadow-amber-500/20 shadow-lg' : 'glass-button hover:scale-105'}`}
            >
              <SettingsIcon size={24} className={isManageMode ? 'text-amber-400' : 'text-foreground/60'} />
            </button>
            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${isManageMode ? 'text-amber-400' : 'text-muted-foreground opacity-60'}`}>Manage</span>
          </div>
        </div>

        {/* Mobile Transactions below action buttons */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between px-8">
            <h2 className="text-[12px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">Account Transactions</h2>
          </div>
          <TransactionTable
            transactions={walletTransactions}
            wallets={wallets}
          />
        </div>
      </div>


      {/* ---------------- DESKTOP LAYOUT ---------------- */}
      <div className="hidden lg:flex flex-col h-full overflow-hidden">

        {/* Content Grid */}
        <div className="flex-1 grid grid-cols-[600px_1fr] overflow-hidden">
          {/* Sidebar — mirrors Dashboard floating card */}
          <div className="p-8 h-full flex flex-col">
            <div className={`flex-1 p-8 rounded-[3rem] border flex flex-col gap-8 transition-colors duration-300 shadow-sm ${isDark ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-slate-100'}`}>
              {/* Title row */}
              <div className="flex items-center justify-between mb-2">
                <h2 className={`font-display text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>My Account</h2>
                <span className={`text-[10px] font-black tabular-nums px-3 py-1.5 rounded-lg ${isDark ? 'bg-white/5 text-white/40' : 'bg-slate-50 text-slate-500'}`}>
                  {wallets.length} {wallets.length === 1 ? 'wallet' : 'wallets'}
                </span>
              </div>

              {/* Total Balance Card */}
              <div className="relative w-full aspect-[1.5/1]">
                <div className="glass-premium-card w-full h-full p-8 flex flex-col justify-between relative group overflow-hidden shadow-2xl">
                  <div className="flex justify-between items-start relative z-10">
                    <div className={`flex items-center gap-2 ${isDark ? 'text-slate-900' : 'text-white'}`}>
                      <img src={logo} alt="Kwartrack" className="h-6 w-auto" />
                      <span className="font-display text-base font-bold tracking-tight">Kwartrack</span>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className={`text-xs font-black uppercase tracking-widest mb-2 opacity-60 ${isDark ? 'text-slate-900/60' : 'text-white/60'}`}>Total Balance</p>
                    <div className="flex items-baseline gap-3">
                      <p className={`font-display text-6xl font-black tracking-tight tabular-nums ${isDark ? 'text-slate-900' : 'text-white'}`}>
                        {formatCurrency(totalBalance).replace(/[^\d.,]/g, '').trim()}
                      </p>
                      <span className={`text-xl font-bold opacity-40 ${isDark ? 'text-slate-900/40' : 'text-white/40'}`}>PHP</span>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 h-full w-[60%] opacity-20 pointer-events-none select-none">
                    <img src={squireeImg} alt="" className="w-full h-full object-contain object-right brightness-110" />
                  </div>
                </div>
              </div>

              <div className={`h-[1px] w-full my-2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />

              {/* Account Management Buttons */}
              <div className="grid grid-rows-3 gap-4">
                <button
                  onClick={() => { impact(); setShowAdd(true); setNewProvider('none'); }}
                  className={`py-5 rounded-2xl text-sm font-black tracking-widest glass-liquid-button ${isDark ? 'text-white' : 'text-black'}`}
                >
                  New Account
                </button>
                <button
                  onClick={() => { impact(); setIsDeleteMode(!isDeleteMode); setIsManageMode(false); }}
                  className={`py-5 rounded-2xl text-sm font-black tracking-widest transition-all ${isDeleteMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : `glass-liquid-button ${isDark ? 'text-white' : 'text-black'}`}`}
                >
                  {isDeleteMode ? 'Cancel Remove' : 'Remove Account'}
                </button>
                <button
                  onClick={() => { impact(); setIsManageMode(!isManageMode); setIsDeleteMode(false); }}
                  className={`py-5 rounded-2xl text-sm font-black tracking-widest transition-all ${isManageMode ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : `glass-liquid-button ${isDark ? 'text-white' : 'text-black'}`}`}
                >
                  {isManageMode ? 'Done Editing' : 'Edit Accounts'}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-8 pb-32 flex flex-col gap-10 h-full overflow-y-auto no-scrollbar">
            {/* Top Row: Horizontal Wallet Stack */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 self-center">Your Wallets</p>
              </div>

              <div
                ref={viewportRef}
                className="relative select-none"
                style={{ width: '100%', height: 320 }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {wallets.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground/30 font-bold uppercase tracking-widest">No accounts found</div>
                ) : (
                  wallets.map((w, i) => {
                    const rel = i - activeIdx;
                    const cfg = getDesktopStackConfig(rel);
                    const Icon = typeIcons[w.type] || Smartphone;
                    const providerLogo = w.provider && w.provider !== 'none' ? providerLogos[w.provider] : null;

                    return (
                      <div
                        key={w.id}
                        onClick={() => i !== activeIdx && !isDeleteMode && !isManageMode && goTo(i)}
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          width: CARD_W,
                          transform: `translateX(calc(-50% + ${cfg.x}px)) translateY(-50%) scale(${cfg.scale})`,
                          opacity: cfg.opacity,
                          zIndex: cfg.zIndex,
                          boxShadow: cfg.shadow,
                          transformOrigin: 'center center',
                          willChange: 'transform, opacity',
                          transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.6s',
                          borderRadius: 24,
                          cursor: i !== activeIdx ? 'pointer' : 'default',
                          overflow: 'hidden',
                        }}
                        className={`glass-frosted border border-border min-h-[190px] flex flex-col ${isDeleteMode ? 'border-rose-500/40 ring-1 ring-rose-500/20' : ''}`}
                      >
                        {/* Card Header */}
                        <div className="card-header shrink-0 p-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                              <Icon {...(w.type === 'physical bank' ? {} : { size: 28 })} className={w.type === 'physical bank' ? '' : 'text-white'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              {isManageMode && i === activeIdx ? (
                                <input
                                  type="text"
                                  value={w.name}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={e => handleUpdateWallet(w.id, { name: e.target.value })}
                                  className="w-full bg-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white outline-none border border-white/20 focus:bg-white/20"
                                />
                              ) : (
                                <p className="text-base font-bold text-white truncate leading-tight">{w.name}</p>
                              )}
                              <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em]">{w.type}</p>
                            </div>
                          </div>
                          {isDeleteMode && i === activeIdx && (
                            <motion.button
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              whileTap={{ scale: 0.8 }}
                              onClick={(e) => { e.stopPropagation(); handleDeleteWallet(w.id); }}
                              className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center border border-white/20 text-white shadow-xl hover:scale-110 transition-transform"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-7 pt-5 flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-end mt-8">
                            <div className="flex flex-col">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 mb-1.5">Available Balance</p>
                              {isManageMode && i === activeIdx ? (
                                <div
                                  className="flex items-center gap-1.5 bg-foreground/5 rounded-xl px-3 py-1.5 border border-foreground/10 focus-within:border-primary/50 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-xs font-bold text-primary">₱</span>
                                  <input
                                    type="number"
                                    value={w.balance}
                                    onChange={e => handleUpdateWallet(w.id, { balance: parseFloat(e.target.value) || 0 })}
                                    className="w-28 bg-transparent text-base font-bold text-foreground outline-none tabular-nums"
                                  />
                                </div>
                              ) : (
                                <p className="font-display text-3xl font-bold text-foreground tabular-nums tracking-tight">
                                  {formatCurrency(w.balance)}
                                </p>
                              )}
                            </div>
                            {providerLogo && (
                              <div className="flex items-center justify-center px-2">
                                <img
                                  src={providerLogo}
                                  alt=""
                                  className={`h-10 w-auto object-contain brightness-110 ${w.provider !== 'gcash' ? 'mix-blend-multiply' : ''}`}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Row: Selected Wallet Transactions */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden mt-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[12px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">Account Transactions</h2>
              </div>

              <div className="flex-1 glass-frosted rounded-[2.5rem] border border-border/10 overflow-hidden flex flex-col shadow-inner">
                <div className="overflow-y-auto h-full no-scrollbar">
                  <TransactionTable
                    transactions={walletTransactions}
                    wallets={wallets}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-sm p-7 rounded-[2.5rem] glass-frosted backdrop-blur-2xl border border-border shadow-3xl pointer-events-auto space-y-5"
              >
                <h3 className="font-display font-bold text-foreground text-xl">New Account</h3>
                <input
                  type="text"
                  placeholder="Account name (e.g. BDO, Personal)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full py-4 px-5 rounded-2xl bg-foreground/[0.08] text-foreground text-base font-semibold placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary transition-all border border-foreground/10"
                />
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Category</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cash', 'physical bank', 'online bank'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => { setNewType(t); if (t !== 'online bank') setNewProvider('none'); }}
                        className={`py-3 rounded-xl text-[10px] font-bold capitalize transition-all ${newType === t ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-foreground/[0.08] text-muted-foreground hover:bg-foreground/[0.12] border border-foreground/10'}`}
                      >
                        {t === 'cash' ? 'Cash' : t === 'physical bank' ? 'Bank' : 'Online'}
                      </button>
                    ))}
                  </div>
                </div>
                {newType === 'online bank' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Provider</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['gcash', 'maya', 'gotyme'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setNewProvider(p)}
                          className={`py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border ${newProvider === p ? 'bg-foreground/[0.15] border-primary text-foreground shadow-lg' : 'bg-foreground/[0.08] border-transparent text-muted-foreground hover:bg-foreground/[0.12]'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setShowAdd(false)} className="flex-1 py-4 rounded-2xl bg-foreground/[0.08] text-muted-foreground text-sm font-bold hover:bg-foreground/[0.12] transition-colors border border-foreground/10">Cancel</button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { impact(); handleAdd(); }}
                    disabled={!newName.trim() || (newType === 'online bank' && newProvider === 'none')}
                    className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    Create
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
