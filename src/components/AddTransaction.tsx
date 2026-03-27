import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, ChevronDown, Check, Calculator, Delete, Banknote, Landmark, Smartphone, LayoutGrid } from 'lucide-react';
import {
  TransactionType, Wallet,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES,
  Transaction, RecurringEntry, getDueRecurringEntries, getFrequentItems
} from '@/lib/store';
import { getPriceSuggestion } from '@/lib/prices';
import gcashLogo from '../assets/gcash-official.png';
import mayaLogo from '../assets/maya-official.png';
import gotymeLogo from '../assets/gotyme-official.png';

const providerLogos: Record<string, string> = {
  gcash: gcashLogo,
  maya: mayaLogo,
  gotyme: gotymeLogo,
};

interface AddTransactionProps {
  wallets: Wallet[];
  transactions: Transaction[];
  recurring: RecurringEntry[];
  customPrices: Record<string, number>;
  onUpdateCustomPrices: (prices: Record<string, number>) => void;
  onSave: (tx: { type: TransactionType; amount: number; category: string; label: string; walletId: string; date: string; recurringId?: string }) => void;
  onUpdateRecurring: (entries: RecurringEntry[]) => void;
  onClose: () => void;
  forcedType?: TransactionType;
  forcedAmount?: number;
  forcedLabel?: string;
  forcedWalletId?: string;
  grocerySessions: any[];
  onUpdateGrocerySessions: (sessions: any[]) => void;
}

import GroceryCartView from './GroceryCartView';

export default function AddTransaction({
  wallets, transactions, recurring, customPrices, onUpdateCustomPrices, onSave, onUpdateRecurring, onClose,
  forcedType, forcedAmount, forcedLabel, forcedWalletId,
  grocerySessions, onUpdateGrocerySessions,
}: AddTransactionProps) {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [type, setType] = useState<TransactionType>(forcedType ?? 'expense');
  const [amount, setAmount] = useState(forcedAmount ? String(forcedAmount) : '0');
  const [category, setCategory] = useState(forcedType === 'expense' ? 'groceries' : '');
  const [label, setLabel] = useState(forcedLabel ?? '');
  const [walletId, setWalletId] = useState(forcedWalletId ?? wallets[0]?.id ?? 'cash');
  const [date, setDate] = useState<Date>(new Date());
  const [suggestion, setSuggestion] = useState<{ price: number; name: string } | null>(null);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const activeCategory = categories.find(c => c.id === category);
  const activeWallet = wallets.find(w => w.id === walletId);

  const getWalletIcon = (wType: string) => {
    switch (wType) {
      case 'cash': return <Banknote size={20} />;
      case 'physical bank': return <Landmark size={20} />;
      case 'online bank': return <Smartphone size={20} />;
      default: return <Banknote size={20} />;
    }
  };

  const handleKey = (key: string) => {
    if (key === 'del') {
      setAmount(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
    } else if (key === 'clear') {
      setAmount('0');
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount(prev => prev + '.');
    } else if (key === '₱') {
      // Currency symbol, decorative
    } else {
      setAmount(prev => prev === '0' ? key : prev + key);
    }
  };

  const getAmountFontSize = (val: string) => {
    const len = val.length;
    if (len > 16) return 'text-3xl';
    if (len > 13) return 'text-4xl';
    if (len > 10) return 'text-5xl';
    if (len > 7) return 'text-6xl';
    return 'text-7xl';
  };

  const handleSave = () => {
    if (!category || parseFloat(amount) <= 0) return;

    // Learning: Save custom price if label exists
    if (label.trim()) {
      onUpdateCustomPrices({
        ...customPrices,
        [label.trim().toLowerCase()]: parseFloat(amount)
      });
    }

    onSave({
      type,
      amount: parseFloat(amount),
      category,
      label: label || (activeCategory?.label ?? ''),
      walletId,
      date: date.toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] md:flex md:items-center md:justify-center p-0 md:p-6 overflow-hidden">
      {/* Desktop Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md hidden md:block cursor-pointer"
      />

      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-[420px] mx-auto md:rounded-[3.5rem] md:shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col z-10 bg-background text-foreground`}
      >
        {/* Desktop & Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:bg-foreground/10 transition-colors z-50 text-foreground/80"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>

        {mode !== 'batch' && (
          <button
            onClick={() => { }}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:bg-foreground/10 transition-colors z-50 text-foreground/80"
          >
            <span className="font-bold text-lg">?</span>
          </button>
        )}

        <h2 className="absolute top-6 left-0 right-0 text-center flex items-center justify-center h-10 font-bold text-foreground text-lg z-40 pointer-events-none">
          Add {type === 'expense' ? 'Expense' : 'Income'}
        </h2>

        {type === 'expense' && mode !== 'batch' && (
          <button
            onClick={() => setMode('batch')}
            className="absolute top-6 right-[4.5rem] h-10 px-4 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:bg-foreground/10 transition-colors z-50 text-xs font-bold text-foreground/80"
          >
            Batch
          </button>
        )}

        {/* Hidden Date Input */}
        <input
          type="date"
          ref={dateInputRef}
          className="hidden"
          value={date.toISOString().split('T')[0]}
          onChange={(e) => {
            if (e.target.value) setDate(new Date(e.target.value));
          }}
        />

        {mode === 'batch' && type === 'expense' ? (
          <div className="flex-1 overflow-hidden flex flex-col mt-20">
            <GroceryCartView
              session={grocerySessions[grocerySessions.length - 1] || {
                id: Date.now().toString(),
                name: 'New Grocery Run',
                walletId: walletId || 'cash',
                budgetCap: null,
                items: [],
                createdAt: new Date().toISOString()
              }}
              wallets={wallets}
              customPrices={customPrices}
              onUpdateCustomPrices={onUpdateCustomPrices}
              onUpdateSession={(updated) => {
                const existing = grocerySessions.findIndex(s => s.id === updated.id);
                if (existing >= 0) {
                  const newSessions = [...grocerySessions];
                  newSessions[existing] = updated;
                  onUpdateGrocerySessions(newSessions);
                } else {
                  onUpdateGrocerySessions([...grocerySessions, updated]);
                }
              }}
              onCheckout={(wId, amt, lbl) => {
                setWalletId(wId);
                setAmount(String(amt));
                setLabel(lbl);
                setCategory('groceries');
                setMode('single');
              }}
              onClose={() => setMode('single')}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col pt-24 pb-8 px-6 overflow-hidden relative">

            {/* Category Card ("To") */}
            <button
              onClick={() => setShowCategoryPicker(true)}
              className="w-full rounded-[1.5rem] p-4 bg-primary text-primary-foreground flex items-center justify-between group active:scale-95 transition-transform shadow-lg shadow-primary/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-black/10 dark:bg-black/20 text-primary-foreground">
                  {activeCategory ? activeCategory.icon : <LayoutGrid size={24} className="opacity-40" />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold">{activeCategory?.label || "Select Category"}</span>
                  <span className="text-[10px] opacity-80 font-medium"> {label || "No note"}</span>
                </div>
              </div>
              <div className="bg-black/10 dark:bg-black/20 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-black/5">
                Change
              </div>
            </button>

            <input
              type="text"
              placeholder="Add a note (optional)"
              value={label}
              onChange={(e) => {
                const val = e.target.value;
                setLabel(val);
                const priceSugg = getPriceSuggestion(val, customPrices);
                setSuggestion(priceSugg ? { price: priceSugg.price, name: priceSugg.name } : null);
              }}
              className="w-full bg-transparent text-center text-sm font-medium text-foreground/40 placeholder:text-foreground/20 outline-none border-none mt-4 -mb-2"
            />

            {/* Amount display */}
            <div className="flex-1 flex flex-col justify-center min-h-[120px] items-center relative gap-2">
              <div className="flex items-center justify-center relative">
                <span className="text-4xl text-foreground/50 mr-2 font-light">₱</span>
                <p className={`font-display font-light text-foreground tabular-nums tracking-tighter truncate max-w-[85%] ${getAmountFontSize(amount)}`}>
                  {amount}
                </p>
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-0.5 h-12 bg-foreground/30 ml-2"
                />
              </div>
              {suggestion && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setAmount(String(suggestion.price)); setLabel(suggestion.name); setSuggestion(null); }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold border border-primary/30 uppercase tracking-widest"
                >
                  <Calculator size={12} /> Suggest: ₱{suggestion.price}
                </motion.button>
              )}
            </div>

            {/* Wallet Card ("From") */}
            <button
              onClick={() => setShowWalletPicker(true)}
              className="w-full rounded-[1.25rem] p-4 bg-foreground/5 border border-foreground/10 flex items-center justify-between group active:scale-95 transition-transform backdrop-blur-md mb-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                  {activeWallet?.provider && activeWallet.provider !== 'none' ? (
                    <img src={providerLogos[activeWallet.provider]} alt="" className="w-full h-auto max-h-full object-contain brightness-110" />
                  ) : (
                    <div className="text-foreground/60 scale-150">
                      {getWalletIcon(activeWallet?.type || 'cash')}
                    </div>
                  )}
                </div>
                <div className="flex flex-col text-left">
                  {(() => {
                    if (!activeWallet) {
                      return <span className="text-[10px] text-foreground/50 font-medium tracking-widest">---</span>;
                    }
                    const currentBalance = activeWallet.balance || 0;
                    const inputAmount = parseFloat(amount) || 0;
                    const rawPreview = type === 'expense' ? currentBalance - inputAmount : currentBalance + inputAmount;

                    // Floor to 0 if expense exceeds balance
                    const previewBalance = type === 'expense' && rawPreview < 0 ? 0 : rawPreview;

                    const isChanging = inputAmount > 0;
                    const colorClass = isChanging
                      ? (type === 'expense' ? (rawPreview < 0 ? 'text-red-500 font-bold' : 'text-orange-500 font-bold') : 'text-emerald-500 font-bold')
                      : 'text-foreground/50 font-medium';

                    return (
                      <span className={`text-[10px] tracking-wider transition-colors ${colorClass}`}>
                        ₱ {previewBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    );
                  })()}
                  <span className="text-sm font-bold text-foreground/90">{activeWallet?.name || "Select Account"}</span>
                </div>
              </div>
              <ChevronDown size={16} className="text-foreground/30 mr-1" />
            </button>

            {/* Custom Premium Keypad */}
            <div className="grid grid-cols-3 gap-y-3 gap-x-3 w-full max-w-[320px] mx-auto mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className="h-[54px] rounded-full bg-foreground/5 border-t border-foreground/10 active:bg-foreground/10 font-display text-2xl font-light text-foreground transition-colors flex items-center justify-center shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                >
                  {key}
                </button>
              ))}
              <button
                onClick={() => handleKey('del')}
                className="h-[54px] rounded-full bg-foreground/5 border-t border-foreground/10 active:bg-foreground/10 text-foreground flex items-center justify-center transition-colors shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
              >
                <Delete size={20} className="opacity-80" />
              </button>
            </div>

            {/* Glowing Send Pill Button */}
            <button
              onClick={handleSave}
              disabled={!category || parseFloat(amount) <= 0 || (type === 'expense' && parseFloat(amount) > (activeWallet?.balance || 0))}
              className="w-full h-[58px] rounded-full bg-primary flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] font-bold text-lg text-primary-foreground transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
            >
              Add {type === 'expense' ? 'Expense' : 'Income'}
            </button>
          </div>
        )}
      </motion.div>

      {/* Category Bottom Sheet */}
      <AnimatePresence>
        {showCategoryPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCategoryPicker(false)}
              className="absolute inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute inset-x-0 bottom-0 z-[210] pt-6 pb-28 rounded-t-[2.5rem] bg-background border-t border-border shadow-2xl h-[75vh] flex flex-col"
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-foreground/10 rounded-full" />

              <div className="flex justify-between items-center mt-4 mb-4 px-8">
                <h3 className="font-display font-bold text-xl text-foreground">
                  {type === 'expense' ? 'Spending type' : 'Income type'}
                </h3>
                <button onClick={() => setShowCategoryPicker(false)} className="p-2 text-foreground active:scale-90 transition-transform hover:bg-foreground/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-[100px] scrollbar-hide">
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(c => {
                    const isSelected = category === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setCategory(c.id); setShowCategoryPicker(false); }}
                        className={`flex items-center p-4 rounded-[1.25rem] transition-all border ${isSelected
                          ? 'bg-[#dcfce7] dark:bg-primary/20 border-transparent relative overflow-hidden'
                          : 'bg-transparent border-transparent hover:bg-foreground/5'
                          }`}
                      >
                        <div className="flex items-center gap-3 relative z-10 w-full">
                          <span className={`text-xl opacity-80 ${isSelected ? 'text-[#166534] dark:text-primary' : 'text-foreground'}`}>{c.icon}</span>
                          <span className={`font-bold text-sm tracking-tight flex-1 text-left ${isSelected ? 'text-[#166534] dark:text-primary' : 'text-foreground'}`}>{c.label}</span>
                          {isSelected && <Check size={16} className="text-[#166534] dark:text-primary shrink-0" strokeWidth={3} />}
                        </div>
                        {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/40 dark:to-black/20 pointer-events-none" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions for Category */}
              <div className="absolute bottom-6 left-0 right-0 px-6 flex gap-3">
                <button className="flex-1 py-4 rounded-2xl bg-foreground/5 text-foreground text-sm font-bold border border-foreground/10 active:scale-95 transition-transform">
                  Manage
                </button>
                <button className="flex-1 py-4 rounded-2xl bg-foreground text-background text-sm font-bold shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
                  + Add new
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Wallet Bottom Sheet */}
      <AnimatePresence>
        {showWalletPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowWalletPicker(false)}
              className="absolute inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute inset-x-0 bottom-0 z-[210] p-6 rounded-t-[2.5rem] bg-background border-t border-border shadow-2xl h-[50vh] flex flex-col"
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-foreground/10 rounded-full" />

              <div className="flex justify-between items-center mt-4 mb-4 px-2">
                <h3 className="font-display font-bold text-xl text-foreground">Select Account</h3>
                <button onClick={() => setShowWalletPicker(false)} className="p-2 text-foreground active:scale-90 transition-transform hover:bg-foreground/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 space-y-2 scrollbar-hide">
                {wallets.map(w => {
                  const isSelected = walletId === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => { setWalletId(w.id); setShowWalletPicker(false); }}
                      className={`w-full flex justify-between items-center p-4 rounded-[1.25rem] transition-all border ${isSelected
                        ? 'bg-[#dcfce7] dark:bg-primary/20 border-transparent relative overflow-hidden'
                        : 'bg-transparent border-transparent hover:bg-foreground/5'
                        }`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                          {w.provider && w.provider !== 'none' ? (
                            <img src={providerLogos[w.provider]} alt="" className="w-full h-auto max-h-full object-contain brightness-110" />
                          ) : (
                            <span className={`text-xl opacity-80 ${isSelected ? 'text-[#166534] dark:text-primary' : 'text-foreground'}`}>{getWalletIcon(w.type)}</span>
                          )}
                        </div>
                        <div className="text-left text-foreground">
                          <p className={`font-bold text-base ${isSelected ? 'text-[#166534] dark:text-primary' : 'text-foreground'}`}>{w.name}</p>
                          <p className={`text-[10px] uppercase font-bold tracking-wider opacity-60 ${isSelected ? 'text-[#166534] dark:text-primary' : 'text-foreground'}`}>{w.type}</p>
                        </div>
                      </div>
                      {isSelected && <Check size={20} className="text-[#166534] dark:text-primary shrink-0 relative z-10" strokeWidth={3} />}
                      {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/40 dark:to-black/20 pointer-events-none" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
