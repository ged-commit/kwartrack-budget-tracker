import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, ChevronDown, Check, Calculator, Delete, Banknote, Landmark, Smartphone } from 'lucide-react';
import {
  TransactionType, Wallet,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES,
  Transaction, RecurringEntry, getDueRecurringEntries, getFrequentItems
} from '@/lib/store';
import { getPriceSuggestion } from '@/lib/prices';

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
    switch(wType) {
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
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className={`fixed inset-0 z-[150] flex flex-col ${type === 'expense' 
        ? 'bg-gradient-to-b from-background via-background to-[#dcfce7] dark:to-[#0f2e1a]' 
        : 'bg-gradient-to-b from-background via-background to-[#e0f2fe] dark:to-[#0c4a6e]'}`}
    >
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

      {/* Header (Hidden in batch mode) */}
      {mode !== 'batch' && (
        <div className="flex items-center justify-between px-6 py-6 pt-10">
          <button onClick={onClose} className="p-2 -ml-2 text-foreground active:scale-90 transition-transform">
            <ArrowLeft size={24} />
          </button>
          <h2 className="font-display text-lg font-bold text-foreground">
            {type === 'expense' ? 'Add expense' : 'Add income'}
          </h2>
          <div className="w-10" />
        </div>
      )}

      {/* Mode Toggle (only for expenses, hidden in batch mode) */}
      {type === 'expense' && mode !== 'batch' && (
        <div className="px-6 mb-4 flex justify-center">
          <div className="flex p-1 rounded-2xl bg-foreground/5 gap-1 w-full max-w-[280px]">
            {(['single', 'batch'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  mode === m ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === m && (
                  <motion.div
                    layoutId="expense-mode-bg"
                    className="absolute inset-0 bg-primary rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 capitalize">{m} Expense</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'batch' && type === 'expense' ? (
        <div className="flex-1 overflow-hidden flex flex-col">
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
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10 space-y-8">
            {/* Amount Display */}
            <div className="flex items-center justify-center relative min-h-[80px] w-full overflow-hidden">
              <span className="text-4xl font-bold text-foreground mr-1">₱</span>
              <p className={`font-display font-bold text-foreground tabular-nums tracking-tighter truncate max-w-[85%] transition-all ${getAmountFontSize(amount)}`}>
                {amount}
              </p>
              <motion.div 
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-1 h-12 bg-primary ml-1 rounded-full"
              />
            </div>

            {/* Pills */}
            <div className="flex items-center gap-3 w-full max-w-sm justify-center">
              <button 
                onClick={() => setShowCategoryPicker(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-3xl bg-background/80 shadow-sm border border-foreground/5 backdrop-blur-md active:scale-95 transition-all text-foreground"
              >
                {activeCategory ? (
                  <>
                    <span className="text-xl flex items-center justify-center">{activeCategory.icon}</span>
                    <span className="font-bold text-sm tracking-tight">{activeCategory.label}</span>
                  </>
                ) : (
                  <span className="font-bold text-sm tracking-tight text-muted-foreground px-2">Category</span>
                )}
                <ChevronDown size={16} className="text-muted-foreground ml-1" />
              </button>

              <button 
                onClick={() => setShowWalletPicker(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-3xl bg-background/80 shadow-sm border border-foreground/5 backdrop-blur-md active:scale-95 transition-all text-foreground"
              >
                {activeWallet ? (
                  <>
                    <span className="text-xl flex items-center justify-center opacity-80 mr-1">{getWalletIcon(activeWallet.type)}</span>
                    <span className="font-bold text-sm tracking-tight">{activeWallet.name}</span>
                  </>
                ) : (
                  <span className="font-bold text-sm tracking-tight text-muted-foreground px-2">Account</span>
                )}
                <ChevronDown size={16} className="text-muted-foreground ml-1" />
              </button>
            </div>

            {/* Note Input */}
            <div className="w-full max-w-xs mx-auto">
              <input 
                type="text" 
                placeholder="Add note ..." 
                value={label}
                onChange={(e) => {
                  const val = e.target.value;
                  setLabel(val);
                  const priceSugg = getPriceSuggestion(val, customPrices);
                  if (priceSugg) {
                    setSuggestion({ price: priceSugg.price, name: priceSugg.name });
                  } else {
                    setSuggestion(null);
                  }
                }}
                className="w-full bg-transparent text-center text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none border-none py-2"
              />
              {suggestion && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => {
                    setAmount(String(suggestion.price));
                    setLabel(suggestion.name);
                    setSuggestion(null);
                  }}
                  className="mt-2 mx-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 hover:bg-primary/20 transition-all"
                >
                  <Calculator size={12} /> Suggest Price: ₱{suggestion.price}
                </motion.button>
              )}
            </div>

            {/* Smart Suggestions Section */}
            {!label && (
              <div className="w-full max-w-sm px-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-3 text-center">Suggestions</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {/* Due Recurring Items (Filtered by type) */}
                  {getDueRecurringEntries(recurring)
                    .filter(r => r.type === type)
                    .map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setAmount(String(r.amount));
                        setLabel(r.label);
                        setCategory(r.category);
                        setWalletId(r.walletId);
                      }}
                      className="px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold flex items-center gap-2 hover:bg-primary/20 transition-all active:scale-95"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      {r.label} (₱{r.amount})
                    </button>
                  ))}
                  
                  {/* Frequent Items (Filtered by type) */}
                  {getFrequentItems(transactions, type).map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setAmount(String(f.amount));
                        setLabel(f.label);
                        setCategory(f.category);
                        setWalletId(f.walletId);
                      }}
                      className="px-4 py-2 rounded-2xl bg-foreground/5 border border-transparent text-muted-foreground text-[11px] font-bold flex items-center gap-2 hover:bg-foreground/10 transition-all active:scale-95"
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Keypad */}
          <div className="bg-background/90 backdrop-blur-xl px-4 py-6 rounded-t-[3rem] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] border-t border-border mt-auto">
            <div className="max-w-sm mx-auto grid grid-cols-4 gap-2.5">
              <div className="col-span-3 grid grid-cols-3 gap-2.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '₱', '0', '.'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    className="h-[60px] rounded-[1.25rem] bg-foreground/5 hover:bg-foreground/10 font-display text-2xl font-bold text-foreground transition-colors active:scale-95"
                  >
                    {key}
                  </button>
                ))}
              </div>

              <div className="col-span-1 grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleKey('del')}
                  className="h-[60px] rounded-[1.25rem] bg-red-100 dark:bg-rose-500/20 text-red-500 flex items-center justify-center transition-colors active:scale-95"
                >
                  <Delete size={24} />
                </button>
                <button
                  onClick={() => handleKey('clear')}
                  className="h-[60px] rounded-[1.25rem] bg-foreground/5 text-foreground flex items-center justify-center transition-colors active:scale-95 font-display font-bold text-lg"
                >
                  C
                </button>
                <button
                  className="h-[60px] rounded-[1.25rem] bg-foreground/5 text-foreground flex items-center justify-center transition-colors active:scale-95"
                >
                  <Calculator size={20} className="opacity-70" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={!category || parseFloat(amount) <= 0 || (type === 'expense' && parseFloat(amount) > (activeWallet?.balance || 0))}
                  className="h-[60px] rounded-[1.25rem] bg-[#65ED3D] text-[#0A2605] flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-[#65ED3D]/20 disabled:bg-foreground/10 disabled:text-foreground/30 disabled:shadow-none"
                >
                  <Check size={28} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
                  <X size={20}/>
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
                          className={`flex items-center p-4 rounded-[1.25rem] transition-all border ${
                            isSelected 
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
                  <X size={20}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 space-y-2 scrollbar-hide">
                {wallets.map(w => {
                  const isSelected = walletId === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => { setWalletId(w.id); setShowWalletPicker(false); }}
                      className={`w-full flex justify-between items-center p-4 rounded-[1.25rem] transition-all border ${
                        isSelected 
                          ? 'bg-[#dcfce7] dark:bg-primary/20 border-transparent relative overflow-hidden' 
                          : 'bg-transparent border-transparent hover:bg-foreground/5'
                      }`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <span className={`text-xl opacity-80 ${isSelected ? 'text-[#166534] dark:text-primary' : 'text-foreground'}`}>{getWalletIcon(w.type)}</span>
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

    </motion.div>
  );
}
