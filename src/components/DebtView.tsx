import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, CreditCard, ArrowDownRight, ArrowUpRight, Calendar, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';
import { Debt, Wallet, formatCurrency, generateId, getWalletIcon } from '@/lib/store';

interface Props {
  debts: Debt[];
  wallets: Wallet[];
  onUpdate: (debts: Debt[]) => void;
  onUpdateWallets: (wallets: Wallet[]) => void;
}

export default function DebtView({ debts, wallets, onUpdate, onUpdateWallets }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [debtType, setDebtType] = useState<'owe' | 'owed'>('owe');
  const [name, setName] = useState('');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');

  const [filter, setFilter] = useState<'all' | 'owe' | 'owed'>('all');

  const filtered = filter === 'all' ? debts : debts.filter(d => d.type === filter);
  const totalOwe = debts.filter(d => d.type === 'owe').reduce((s, d) => s + (d.originalAmount - d.paidAmount), 0);
  const totalOwed = debts.filter(d => d.type === 'owed').reduce((s, d) => s + (d.originalAmount - d.paidAmount), 0);
  const activeCount = debts.filter(d => d.paidAmount < d.originalAmount).length;

  const handleAdd = () => {
    if (!name.trim() || !amount) return;
    onUpdate([...debts, {
      id: generateId(),
      name: name.trim(),
      type: debtType,
      person: person.trim(),
      originalAmount: parseFloat(amount),
      paidAmount: 0,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      payments: [],
    }]);
    setName(''); setPerson(''); setAmount(''); setDueDate(''); setNotes('');
    setShowAdd(false);
  };

  const handlePayment = () => {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0 || !selectedDebtId || !selectedWalletId) return;

    const wallet = wallets.find(w => w.id === selectedWalletId);
    if (!wallet || wallet.balance < amt) {
      alert("Insufficient funds in selected wallet.");
      return;
    }

    onUpdate(debts.map(d => {
      if (d.id !== selectedDebtId) return d;
      return {
        ...d,
        paidAmount: d.paidAmount + amt,
        payments: [...d.payments, { id: generateId(), amount: amt, date: new Date().toISOString(), walletId: selectedWalletId }],
      };
    }));

    onUpdateWallets(wallets.map(w =>
      w.id === selectedWalletId ? { ...w, balance: w.balance - amt } : w
    ));

    setShowPayModal(false);
    setSelectedDebtId(null);
    setPayAmount('');
  };

  const handleDelete = (id: string) => {
    onUpdate(debts.filter(d => d.id !== id));
  };

  return (
    <div className="px-6 pt-8 md:pt-12 pb-48 space-y-8 max-w-lg lg:max-w-7xl mx-auto">
      {/* Desktop Header */}
      <div className="hidden lg:block mb-4">
        <h1 className="font-display text-4xl font-black text-foreground mb-2">Debt Management</h1>
        <p className="text-muted-foreground font-medium">Keep track of your payables and receivables.</p>
      </div>

      <div className="lg:hidden">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4ade80]">Debt Tracking</p>
        <h1 className="font-display text-3xl font-bold text-foreground">Manage your dues</h1>
        <p className="text-sm text-muted-foreground leading-snug">
          Keep track of money you owe and money people owe you.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5 space-y-8">
          <div className="flex justify-between items-center bg-[#4ade80]/10 p-5 rounded-[2rem] border border-[#4ade80]/20 gap-4">
            <div>
              <p className="text-sm font-bold text-foreground">Need to log a new due?</p>
              <p className="text-[10px] text-muted-foreground font-medium">Keep your books balanced.</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="glass-button px-5 py-3 text-[#4ade80] text-sm font-bold shadow-lg shadow-emerald-500/5"
            >
              <Plus size={16} className="mr-2 inline" /> New debt
            </button>
          </div>

          <GlassCard className="p-7 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mb-1.5">Total Outstanding</p>
                <p className="font-display text-4xl font-bold text-foreground tabular-nums tracking-tight">
                  {formatCurrency(totalOwe)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ArrowUpRight size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground opacity-50">Receivable</p>
                  <p className="text-base font-bold text-foreground">{formatCurrency(totalOwed)}</p>
                </div>
              </div>
              <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Info size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground opacity-50">Active Items</p>
                  <p className="text-base font-bold text-foreground">{activeCount}</p>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-2">Filter Dues</p>
            <div className="flex p-1.5 glass-frosted rounded-2xl border border-white/5">
              {(['all', 'owe', 'owed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${filter === f
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {f === 'all' ? 'All' : f === 'owe' ? 'I Owe' : 'Owed'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 mt-8 lg:mt-0">
          <p className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-4 px-2">Debt List</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(d => {
              const remaining = d.originalAmount - d.paidAmount;
              const pct = Math.min((d.paidAmount / d.originalAmount) * 100, 100);
              const isPaid = remaining <= 0;

              return (
                <GlassCard key={d.id} className="p-6 rounded-[2rem] flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${d.type === 'owe' ? 'bg-amber-400' : 'bg-[#4ade80]'}`} />
                        <h3 className="font-display text-lg font-bold text-foreground">{d.name}</h3>
                      </div>
                      <button onClick={() => handleDelete(d.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-5">
                      {d.person} • {d.type === 'owe' ? 'To be paid' : 'To be received'}
                    </p>

                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground opacity-50 mb-0.5">Remaining</p>
                        <p className="font-display text-2xl font-bold text-foreground tabular-nums">
                          {formatCurrency(Math.max(remaining, 0))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground opacity-50 mb-0.5">Total</p>
                        <p className="text-sm font-bold text-muted-foreground/60 tabular-nums">
                          {formatCurrency(d.originalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="h-2 rounded-full bg-black/10 dark:bg-white/5 overflow-hidden mb-6">
                      <motion.div
                        className={`h-full rounded-full ${d.type === 'owe' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'bg-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {d.dueDate && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          <Calendar size={12} />
                          {new Date(d.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#4ade80] bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                        <CreditCard size={12} />
                        {Math.round(pct)}% paid
                      </div>
                    </div>
                  </div>

                  {!isPaid && (
                    <button
                      onClick={() => {
                        setSelectedDebtId(d.id);
                        setShowPayModal(true);
                      }}
                      className="glass-button w-full py-3 text-foreground text-sm font-bold gap-2 shadow-xl shadow-black/5"
                    >
                      <ArrowDownRight size={18} className="text-[#4ade80]" />
                      Pay Debt
                    </button>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {(showAdd || showPayModal) && (
            <div key="debt-modal-container" className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none text-left">
              <motion.div
                key="debt-backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => { setShowAdd(false); setShowPayModal(false); }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
              />
              
              {showAdd && (
                <div key="debt-add-wrapper" className="fixed inset-0 flex items-center justify-center md:p-4 pointer-events-none z-10">
                  <motion.div
                    key="debt-add-modal"
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 md:relative md:inset-auto w-full h-full md:w-full md:h-auto md:max-w-sm bg-background md:bg-background/80 md:backdrop-blur-2xl md:rounded-[3rem] border-none md:border md:border-foreground/5 shadow-2xl overflow-hidden flex flex-col md:max-h-[90vh] pointer-events-auto"
                  >
                    <div className="flex items-center justify-between px-8 py-8 pb-4 shrink-0">
                      <h3 className="font-display font-black text-foreground text-xl">New Debt</h3>
                      <button onClick={() => setShowAdd(false)} className="p-2 rounded-full hover:bg-foreground/5 text-foreground transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 custom-scrollbar no-scrollbar">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Debt Type</label>
                        <div className="flex p-1 rounded-2xl bg-foreground/5 border border-foreground/5">
                          {(['owe', 'owed'] as const).map(t => (
                            <button key={t} onClick={() => setDebtType(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${debtType === t ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-foreground'}`}>
                              {t === 'owe' ? 'I Owe' : 'Owed to Me'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Debt Name</label>
                        <input type="text" placeholder="e.g. Car repair loan" value={name} onChange={e => setName(e.target.value)} className="w-full py-4 px-6 rounded-[2rem] bg-foreground/5 text-foreground text-base font-bold outline-none border border-transparent focus:border-primary/20 transition-all placeholder:text-muted-foreground/30" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Person</label>
                        <input type="text" placeholder="e.g. Name" value={person} onChange={e => setPerson(e.target.value)} className="w-full py-4 px-6 rounded-[2rem] bg-foreground/5 text-foreground text-base font-bold outline-none border border-transparent focus:border-primary/20 transition-all placeholder:text-muted-foreground/30" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Total Amount</label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/30 font-bold text-lg">₱</span>
                          <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full py-4 pl-12 pr-6 rounded-[2rem] bg-foreground/5 text-foreground text-base font-bold outline-none border border-transparent focus:border-primary/20 transition-all tabular-nums" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Due Date</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full py-4 px-6 rounded-[2rem] bg-foreground/5 text-foreground text-sm font-bold outline-none border border-transparent focus:border-primary/20 transition-all [color-scheme:light] dark:[color-scheme:dark]" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Notes</label>
                        <textarea placeholder="Details..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full py-4 px-6 rounded-[2rem] bg-foreground/5 text-foreground text-base font-bold outline-none border border-transparent focus:border-primary/20 transition-all resize-none h-32 placeholder:text-muted-foreground/30" />
                      </div>
                    </div>

                    <div className="px-8 py-8 pt-0 mt-auto shrink-0">
                      <motion.button whileTap={{ scale: 0.98 }} onClick={handleAdd} className="w-full py-5 rounded-[2rem] bg-primary text-primary-foreground text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all">
                        Create Debt
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              )}

              {showPayModal && (
                <div key="debt-pay-wrapper" className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-10">
                  <motion.div
                    key="debt-pay-modal"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-sm p-6 rounded-[2rem] glass-liquid border border-white/10 shadow-2xl pointer-events-auto space-y-4"
                  >
                    <h3 className="font-display font-bold text-foreground text-lg">Pay Debt</h3>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Select Account</label>
                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                          {wallets.map(w => (
                            <button key={w.id} onClick={() => setSelectedWalletId(w.id)} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${selectedWalletId === w.id ? 'bg-amber-400/10 border-amber-400/30 ring-1 ring-amber-400/20' : 'bg-white/5 border-white/5'}`}>
                              <div className="flex items-center gap-3"><span className="text-lg opacity-80">{getWalletIcon(w.type, 18)}</span><div className="text-left"><p className="text-sm font-bold text-foreground">{w.name}</p><p className="text-[10px] text-muted-foreground">{w.type}</p></div></div>
                              <p className="text-sm font-bold text-foreground tracking-tight">{formatCurrency(w.balance)}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Payment Amount</label>
                        <input type="number" placeholder="0.00" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full py-3.5 px-4 rounded-xl bg-foreground/5 text-foreground text-base font-semibold outline-none border border-white/5" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-white/5">
                      <button onClick={() => setShowPayModal(false)} className="flex-1 py-3 rounded-xl bg-foreground/5 text-muted-foreground text-sm font-bold">Cancel</button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={handlePayment} disabled={!payAmount || parseFloat(payAmount) <= 0 || parseFloat(payAmount) > (wallets.find(w => w.id === selectedWalletId)?.balance || 0)} className="flex-1 py-3 rounded-xl bg-amber-400 text-black text-sm font-bold shadow-lg shadow-amber-500/10 transition-all">Confirm</motion.button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
