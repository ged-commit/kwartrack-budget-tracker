import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Plus, Trash2, Square, CheckSquare,
  ChevronDown, X, Banknote, Landmark, Smartphone, ShoppingBag,
} from 'lucide-react';
import {
  GrocerySession, GroceryItem, Wallet,
  generateId, formatCurrency,
} from '@/lib/store';
import { getPriceSuggestion } from '@/lib/prices';
import squireeImg from '@/assets/squiree-mascot.png';

interface GroceryCartViewProps {
  session: GrocerySession;
  wallets: Wallet[];
  customPrices: Record<string, number>;
  onUpdateCustomPrices: (prices: Record<string, number>) => void;
  onUpdateSession: (session: GrocerySession) => void;
  onCheckout: (walletId: string, amount: number, label: string) => void;
  onClose: () => void;
}

function getWalletIcon(type: string) {
  switch (type) {
    case 'cash': return <Banknote size={18} />;
    case 'physical bank': return <Landmark size={18} />;
    case 'online bank': return <Smartphone size={18} />;
    default: return <Banknote size={18} />;
  }
}

function BudgetBanner({
  total,
  cap,
  walletBalance,
}: {
  total: number;
  cap: number | null;
  walletBalance: number;
}) {
  const limit = (cap !== null && !isNaN(cap)) ? cap : (isNaN(walletBalance) ? 0 : walletBalance);
  const safeTotal = isNaN(total) ? 0 : total;
  const pct = limit > 0 ? (safeTotal / limit) * 100 : 0;

  let status: 'safe' | 'close' | 'over';
  let color: string;
  let bg: string;
  let label: string;
  let squireeTip: string;

  if (pct >= 100) {
    status = 'over';
    color = 'text-red-500';
    bg = 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
    label = 'Over Budget!';
    squireeTip = `You're ₱${formatCurrency(total - limit).replace('₱', '')} over. Maybe skip a few things?`;
  } else if (pct >= 80) {
    status = 'close';
    color = 'text-amber-500';
    bg = 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
    label = 'Getting Close';
    squireeTip = `Only ${formatCurrency(limit - total)} left. Be careful!`;
  } else {
    status = 'safe';
    color = 'text-emerald-500';
    bg = 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
    label = 'Looks Good!';
    squireeTip = `${formatCurrency(limit - total)} remaining.`;
  }

  return (
    <div className={`flex items-center gap-4 p-4 rounded-[1.25rem] border ${bg} transition-all duration-500`}>
      {/* Squiree mascot */}
      <motion.img
        key={status}
        src={squireeImg}
        alt="Squiree"
        className="w-14 h-14 object-contain flex-shrink-0 filter drop-shadow-md"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: status === 'over' ? [1, 1.05, 0.97, 1] : 1,
          opacity: 1,
          rotate: status === 'safe' ? 0 : status === 'close' ? [-3, 3, 0] : [-5, 5, -5, 0],
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`font-black text-sm uppercase tracking-widest ${color}`}>{label}</p>
        <p className="text-xs text-foreground/70 font-medium mt-0.5 leading-snug">{squireeTip}</p>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              status === 'over'
                ? 'bg-red-500'
                : status === 'close'
                ? 'bg-amber-400'
                : 'bg-emerald-500'
            }`}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Total */}
      <div className="flex-shrink-0 text-right">
        <p className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">Total</p>
        <p className={`font-display font-black text-lg tabular-nums ${color}`}>
          ₱{(isNaN(total) ? 0 : total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onDelete,
  onUpdate,
}: {
  item: GroceryItem;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<GroceryItem>) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-[1rem] transition-colors ${
        item.checked ? 'bg-foreground/5' : 'bg-background border border-border/50 shadow-sm'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex-shrink-0 text-foreground/60 active:scale-90 transition-transform"
      >
        {item.checked ? (
          <CheckSquare size={22} className="text-primary" />
        ) : (
          <Square size={22} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold truncate transition-colors ${
            item.checked ? 'line-through text-foreground/40' : 'text-foreground'
          }`}
        >
          {item.name}
        </p>
      </div>

      <span
        className={`font-display font-bold text-sm tabular-nums flex-shrink-0 ${
          item.checked ? 'text-foreground/30 line-through' : 'text-foreground'
        }`}
      >
        ₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
      </span>

      <button
        onClick={onDelete}
        className="flex-shrink-0 p-1.5 rounded-full text-foreground/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90 transition-all"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}

function AddItemRow({ onAdd, customPrices }: { onAdd: (name: string, price: number) => void; customPrices: Record<string, number> }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [suggestion, setSuggestion] = useState<number | null>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const p = parseFloat(price);
    if (!name.trim() || isNaN(p) || p <= 0) return;
    onAdd(name.trim(), p);
    setName('');
    setPrice('');
    setSuggestion(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {suggestion && !price && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setPrice(String(suggestion))}
          className="self-end mr-12 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1.5"
        >
          <ShoppingCart size={10} /> Use suggested price: ₱{suggestion}
        </motion.button>
      )}
      <div className="flex items-center gap-2 px-4 py-3 bg-background/80 backdrop-blur-md border border-border/50 rounded-[1.25rem] shadow-sm">
        <ShoppingBag size={18} className="text-muted-foreground flex-shrink-0" />

        <input
          type="text"
          placeholder="Item name"
          value={name}
          onChange={(e) => {
            const val = e.target.value;
            setName(val);
            const priceSugg = getPriceSuggestion(val, customPrices);
            setSuggestion(priceSugg ? priceSugg.price : null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && priceRef.current?.focus()}
          className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none border-none min-w-0"
        />

        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs font-bold text-muted-foreground">₱</span>
          <input
            ref={priceRef}
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-20 bg-transparent text-sm font-bold text-foreground placeholder:text-muted-foreground/60 outline-none border-none text-right"
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={!name.trim() || !price}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-primary disabled:bg-foreground/10 text-primary-foreground disabled:text-foreground/30 flex items-center justify-center active:scale-90 transition-all shadow-md shadow-primary/20 disabled:shadow-none"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default function GroceryCartView({
  session, wallets, customPrices, onUpdateCustomPrices, onUpdateSession, onCheckout, onClose,
}: GroceryCartViewProps) {
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const activeWallet = wallets.find((w) => w.id === session.walletId) ?? wallets[0];

  // Helpers
  const updateSession = (patch: Partial<GrocerySession>) => {
    onUpdateSession({ ...session, ...patch });
  };

  const handleAddItem = (name: string, price: number) => {
    const newItem: GroceryItem = {
      id: generateId(),
      name,
      price,
      quantity: 1,
      checked: false,
    };
    onUpdateSession({
      ...session,
      items: [...session.items, newItem],
    });
    
    // Learning: update custom prices
    onUpdateCustomPrices({
      ...customPrices,
      [name.toLowerCase()]: price
    });
  };

  const toggleItem = (itemId: string) => {
    updateSession({
      items: session.items.map((i) =>
        i.id === itemId ? { ...i, checked: !i.checked } : i
      ),
    });
  };

  const deleteItem = (itemId: string) => {
    updateSession({ items: session.items.filter((i) => i.id !== itemId) });
  };

  const runningTotal = session.items.reduce((s, i) => s + (i.checked ? 0 : (i.price || 0) * (i.quantity || 1)), 0);

  const checkedTotal = session.items.reduce((s, i) => s + (i.checked ? (i.price || 0) * (i.quantity || 1) : 0), 0);

  const handleCheckout = () => {
    onCheckout(
      session.walletId,
      runningTotal,
      session.name
    );
  };

  // ── Active session ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col pb-40 flex-1 overflow-hidden">

      {/* Header */}
      <div className="bg-[hsl(var(--dash-header-bg))] px-6 pt-10 pb-8 rounded-b-[3rem] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          {/* Back button */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-[hsl(var(--dash-header-muted))] hover:text-[hsl(var(--dash-header-text))] active:scale-90 transition-all"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Session name */}
          <div className="flex-1 min-w-0 mx-3">
            {editingName ? (
              <input
                autoFocus
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() => {
                  if (nameInput.trim()) updateSession({ name: nameInput.trim() });
                  setEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (nameInput.trim()) updateSession({ name: nameInput.trim() });
                    setEditingName(false);
                  }
                }}
                className="font-display text-xl font-black text-[hsl(var(--dash-header-text))] bg-transparent outline-none border-b-2 border-primary w-full"
              />
            ) : (
              <button
                onClick={() => { setNameInput(session.name); setEditingName(true); }}
                className="text-left w-full"
              >
                <p className="text-[10px] text-[hsl(var(--dash-header-muted))] font-bold uppercase tracking-widest mb-0.5">
                  Grocery Run
                </p>
                <h1 className="font-display text-xl font-black text-[hsl(var(--dash-header-text))] leading-none truncate">
                  {session.name}
                </h1>
              </button>
            )}
          </div>
        </div>

        {/* Sub controls: wallet + budget cap */}
        <div className="flex gap-2.5 flex-wrap">
          {/* Wallet picker */}
          <button
            onClick={() => setShowWalletPicker(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 text-[hsl(var(--dash-header-text))] text-xs font-bold active:scale-95 transition-transform"
          >
            <span className="opacity-70">{getWalletIcon(activeWallet?.type ?? 'cash')}</span>
            {activeWallet?.name ?? 'Select Wallet'}
            <ChevronDown size={14} className="opacity-60" />
          </button>

          {/* Budget cap */}
          {session.budgetCap !== null ? (
            <button
              onClick={() => {
                setBudgetInput(String(session.budgetCap ?? ''));
                setShowBudgetInput(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 text-[hsl(var(--dash-header-text))] text-xs font-bold active:scale-95 transition-transform"
            >
              Budget: ₱{session.budgetCap?.toLocaleString()}
              <ChevronDown size={14} className="opacity-60" />
            </button>
          ) : (
            <button
              onClick={() => { setBudgetInput(''); setShowBudgetInput(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 text-[hsl(var(--dash-header-muted))] text-xs font-bold active:scale-95 transition-transform"
            >
              <Plus size={14} />
              Set Budget Cap
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto pb-[15rem]">

        {/* Budget status banner */}
        <BudgetBanner
          total={runningTotal}
          cap={session.budgetCap}
          walletBalance={activeWallet?.balance ?? 0}
        />

        {/* Items */}
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {session.items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground text-sm font-medium"
              >
                Your cart is empty. Add your first item below!
              </motion.div>
            ) : (
              session.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem(item.id)}
                  onDelete={() => deleteItem(item.id)}
                  onUpdate={(patch) => {
                    updateSession({
                      items: session.items.map((i) =>
                        i.id === item.id ? { ...i, ...patch } : i
                      ),
                    });
                  }}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Checked summary */}
        {checkedTotal > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            ✓ {session.items.filter((i) => i.checked).length} item(s) set aside —{' '}
            {formatCurrency(checkedTotal)} not included in total
          </p>
        )}
      </div>

      {/* Sticky bottom: add item + checkout — z-[110] to sit above BottomNav z-[100] */}
      <div className="absolute bottom-0 left-0 right-0 z-[110] bg-background/95 backdrop-blur-xl border-t border-border px-5 pt-4 pb-[6.5rem] space-y-3">
          <AddItemRow 
            onAdd={handleAddItem} 
            customPrices={customPrices}
          />

        <button
          onClick={handleCheckout}
          disabled={runningTotal <= 0}
          className="w-full py-4 rounded-2xl bg-primary disabled:bg-foreground/10 text-primary-foreground disabled:text-foreground/30 font-bold text-sm flex items-center justify-center gap-3 shadow-xl shadow-primary/25 disabled:shadow-none active:scale-[0.98] transition-all"
        >
          <ShoppingCart size={18} />
          Checkout & Save
          {runningTotal > 0 && (
            <span className="ml-1 font-display font-black">
              — {formatCurrency(runningTotal)}
            </span>
          )}
        </button>
      </div>

      {/* Wallet bottom sheet */}
      <AnimatePresence>
        {showWalletPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowWalletPicker(false)}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-x-0 bottom-0 z-[210] p-6 rounded-t-[2.5rem] bg-background border-t border-border shadow-2xl"
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-foreground/10 rounded-full" />
              <div className="flex justify-between items-center mt-4 mb-5">
                <h3 className="font-display font-bold text-xl text-foreground">Select Wallet</h3>
                <button onClick={() => setShowWalletPicker(false)} className="p-2 rounded-full hover:bg-foreground/5 active:scale-90 transition-all text-foreground">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-2 pb-6">
                {wallets.map((w) => {
                  const isSelected = session.walletId === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => { updateSession({ walletId: w.id }); setShowWalletPicker(false); }}
                      className={`w-full flex justify-between items-center p-4 rounded-[1.25rem] transition-all border ${
                        isSelected
                          ? 'bg-[#dcfce7] dark:bg-primary/20 border-transparent'
                          : 'bg-transparent border-transparent hover:bg-foreground/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isSelected ? 'text-primary' : 'text-foreground opacity-70'}>
                          {getWalletIcon(w.type)}
                        </span>
                        <div className="text-left">
                          <p className={`font-bold text-sm ${isSelected ? 'text-[#166534] dark:text-primary' : 'text-foreground'}`}>{w.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{w.type}</p>
                        </div>
                      </div>
                      <span className={`font-display font-bold text-sm tabular-nums ${isSelected ? 'text-[#166534] dark:text-primary' : 'text-foreground'}`}>
                        {formatCurrency(w.balance)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Budget cap bottom sheet */}
      <AnimatePresence>
        {showBudgetInput && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBudgetInput(false)}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-x-0 bottom-0 z-[210] p-6 rounded-t-[2.5rem] bg-background border-t border-border shadow-2xl"
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-foreground/10 rounded-full" />
              <div className="flex justify-between items-center mt-4 mb-5">
                <h3 className="font-display font-bold text-xl text-foreground">Set Budget Cap</h3>
                <button onClick={() => setShowBudgetInput(false)} className="p-2 rounded-full hover:bg-foreground/5 active:scale-90 transition-all text-foreground">
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                This cap is just for this shopping run. Leave empty to use your wallet balance as the limit.
              </p>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-foreground/5 mb-4">
                <span className="text-3xl font-black text-foreground">₱</span>
                <input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="flex-1 bg-transparent text-3xl font-black text-foreground placeholder:text-foreground/20 outline-none border-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { updateSession({ budgetCap: null }); setShowBudgetInput(false); }}
                  className="flex-1 py-4 rounded-2xl bg-foreground/5 text-foreground text-sm font-bold border border-foreground/10 active:scale-95 transition-transform"
                >
                  Remove Cap
                </button>
                <button
                  onClick={() => {
                    const cap = parseFloat(budgetInput);
                    updateSession({ budgetCap: isNaN(cap) || cap <= 0 ? null : cap });
                    setShowBudgetInput(false);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-foreground text-background text-sm font-bold shadow-xl active:scale-95 transition-transform"
                >
                  Set Cap
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
