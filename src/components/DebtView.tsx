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
    <div className="w-full px-8 pt-6 md:pt-10 pb-28 space-y-8">
      {/* Desktop Header Redesign */}
      <div className="hidden lg:flex items-end justify-between mb-8 border-b border-foreground/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-amber-400 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.4)]" />
            <h1 className="font-display text-5xl font-black text-foreground tracking-tighter">Liability & Assets</h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg max-w-md">Maintain financial balance by tracking your external dues and receivables.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Outstanding Debt</p>
          <p className="font-display text-3xl font-bold text-rose-500 tabular-nums">{formatCurrency(totalOwe)}</p>
        </div>
      </div>

      <div className="lg:hidden">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4ade80]">Debt Tracking</p>
        <h1 className="font-display text-3xl font-bold text-foreground">Manage your dues</h1>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5 space-y-10">
          <div className="group relative overflow-hidden bg-amber-400/10 p-6 rounded-[2.5rem] border border-amber-400/20 transition-all hover:bg-amber-400/15">
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-lg font-bold text-foreground mb-1">New financial entry?</p>
                <p className="text-xs text-muted-foreground font-medium opacity-80">Log a new payable or receivable instantly.</p>
              </div>
              <button 
                onClick={() => setShowAdd(true)} 
                className="glass-button px-6 py-4 text-black bg-amber-400 text-sm font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Plus size={18} className="mr-2" /> CREATE
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-400 opacity-5 blur-[60px]" />
          </div>

          <div className="glass-liquid p-8 rounded-[3rem] relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Net Financial Standing</p>
                  <p className={`font-display text-5xl font-bold tabular-nums tracking-tighter leading-none ${totalOwed - totalOwe >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                    {formatCurrency(totalOwed - totalOwe)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/[0.03] p-5 rounded-3xl border border-white/5 flex flex-col gap-3 group-hover:bg-white/[0.05] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-50 mb-1">Receivables</p>
                    <p className="text-xl font-display font-bold text-foreground truncate" title={formatCurrency(totalOwed)}>{formatCurrency(totalOwed)}</p>
                  </div>
                </div>
                <div className="bg-white/[0.03] p-5 rounded-3xl border border-white/5 flex flex-col gap-3 group-hover:bg-white/[0.05] transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                    <ArrowDownRight size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-50 mb-1">Payables</p>
                    <p className="text-xl font-display font-bold text-foreground truncate" title={formatCurrency(totalOwe)}>{formatCurrency(totalOwe)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 blur-[100px] pointer-events-none" />
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-3">Filter Transactions</p>
            <div className="flex p-1.5 glass-frosted rounded-3xl border border-white/5">
              {(['all', 'owe', 'owed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {f === 'all' ? 'Entire Ledger' : f === 'owe' ? 'To be Paid' : 'Receivables'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 mt-12 lg:mt-0 space-y-6">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Active Records</p>
            <p className="text-[11px] font-bold text-muted-foreground/60">{activeCount} ongoing items</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(d => {
              const remaining = d.originalAmount - d.paidAmount;
              const pct = Math.min((d.paidAmount / d.originalAmount) * 100, 100);
              const isPaid = remaining <= 0;
              const accentColor = d.type === 'owe' ? '#fbbf24' : '#4ade80';

              return (
                <div key={d.id} className="glass-liquid p-6 rounded-[2.5rem] flex flex-col justify-between h-full border border-white/5 group hover:border-white/10 transition-all">
                  <div className="relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse`} style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}44` }} />
                        <h3 className="font-display text-xl font-bold text-foreground">{d.name}</h3>
                      </div>
                      <button onClick={() => handleDelete(d.id)} className="w-10 h-10 rounded-xl hover:bg-rose-500/10 text-muted-foreground/30 hover:text-rose-500 flex items-center justify-center transition-all p-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <p className="text-xs font-bold text-muted-foreground/60 bg-foreground/5 w-fit px-3 py-1 rounded-full mb-6 border border-white/5">
                      {d.person} • {d.type === 'owe' ? 'Payable' : 'Asset'}
                    </p>

                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-50 mb-1">Unpaid Balance</p>
                         <p className="font-display text-3xl font-bold text-foreground tabular-nums tracking-tighter">
                          {formatCurrency(Math.max(remaining, 0)).replace('₱', '')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-50 mb-1">Total</p>
                        <p className="text-sm font-bold text-muted-foreground/40 tabular-nums">
                          {formatCurrency(d.originalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="h-3 rounded-full bg-foreground/5 overflow-hidden mb-6 relative shadow-inner">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: accentColor, boxShadow: `0 0 15px ${accentColor}66` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 mb-8">
                      {d.dueDate && (
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 bg-foreground/5 px-3 py-1.5 rounded-xl border border-white/5">
                          <Calendar size={14} className="opacity-60" />
                          {new Date(d.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border" style={{ color: accentColor, borderColor: `${accentColor}33`, backgroundColor: `${accentColor}11` }}>
                        <CreditCard size={14} />
                        {Math.round(pct)}% Settled
                      </div>
                    </div>
                  </div>

                  {!isPaid && (
                    <button
                      onClick={() => {
                        setSelectedDebtId(d.id);
                        setShowPayModal(true);
                      }}
                      className="group relative overflow-hidden w-full py-4 rounded-2xl bg-foreground text-background font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        <ArrowDownRight size={20} /> UPDATE STATUS
                      </span>
                      <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-2xl" style={{ backgroundColor: accentColor }} />
                    </button>
                  )}
                </div>
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
