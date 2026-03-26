import { useState, useMemo } from 'react';
import { Plus, ChevronLeft, Trash2, Wallet as WalletIcon, ReceiptText, Calendar, CreditCard, Lightbulb, X, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';
import { Goal, Wallet, formatCurrency, generateId, GoalPayment, getWalletIcon } from '@/lib/store';
import squireeCelebrate from '@/assets/squiree-celebrate.png';

interface Props {
  goals: Goal[];
  wallets: Wallet[];
  onUpdate: (goals: Goal[]) => void;
  onUpdateWallets: (wallets: Wallet[]) => void;
  onBack?: () => void;
}

export default function GoalsView({ goals, wallets, onUpdate, onUpdateWallets, onBack }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [startingSaved, setStartingSaved] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [schedule, setSchedule] = useState<Goal['schedule'] | ''>('');
  const [customAmount, setCustomAmount] = useState('');
  const [error, setError] = useState('');

  const [showAllocate, setShowAllocate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCelebration, setShowCelebration] = useState<string | null>(null);

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [allocateAmt, setAllocateAmt] = useState('');
  const [historyGoalId, setHistoryGoalId] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');


  const activeGoals = goals.filter(g => !g.completed).length;
  const completedGoals = goals.filter(g => g.completed).length;
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);

  const newGoalCalcs = useMemo(() => {
    if (!schedule || !dueDate || !target || (schedule === 'Custom' && !customAmount)) return null;
    const t = parseFloat(target) || 0;
    const s = parseFloat(startingSaved) || 0;
    const remaining = Math.max(t - s, 0);
    if (remaining <= 0) return null;

    let days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) days = 1;

    let periods = 1;
    if (schedule === 'Weekly') periods = Math.ceil(days / 7);
    else if (schedule === 'Bi-weekly') periods = Math.ceil(days / 14);
    else if (schedule === 'Monthly') periods = Math.ceil(days / 30);
    else if (schedule === 'Custom') {
      const ca = parseFloat(customAmount);
      if (ca > 0) periods = Math.ceil(remaining / ca);
    }
    periods = Math.max(periods, 1);

    const suggested = schedule === 'Custom' ? parseFloat(customAmount) : remaining / periods;

    let nextPay = new Date();
    if (schedule === 'Weekly') nextPay.setDate(nextPay.getDate() + 7);
    else if (schedule === 'Bi-weekly') nextPay.setDate(nextPay.getDate() + 14);
    else if (schedule === 'Monthly') nextPay.setDate(nextPay.getDate() + 30);
    if (schedule === 'Custom') nextPay.setDate(nextPay.getDate() + 30);

    const dDate = new Date(dueDate);
    if (nextPay > dDate) nextPay = dDate;

    return { suggested, periods, nextPay: nextPay.toISOString().split('T')[0] };
  }, [schedule, dueDate, target, startingSaved, customAmount]);

  const handleAdd = () => {
    if (!name.trim() || !target) { setError("Name and target are required."); return; }
    const t = parseFloat(target);
    const s = parseFloat(startingSaved) || 0;

    if (s >= t) { setError("Your starting amount already meets or exceeds your target."); return; }

    onUpdate([...goals, {
      id: generateId(),
      name: name.trim(),
      target: t,
      saved: s,
      startingSaved: s,
      deadline: dueDate || undefined,
      schedule: schedule || undefined,
      customAmount: schedule === 'Custom' ? parseFloat(customAmount) || 0 : undefined,
      completed: s >= t,
      payments: []
    }]);

    setName(''); setTarget(''); setStartingSaved(''); setDueDate(''); setSchedule(''); setCustomAmount(''); setError(''); setShowAdd(false);
  };

  const handleAllocate = () => {
    const amt = parseFloat(allocateAmt);
    if (!amt || amt <= 0 || !selectedGoalId || !selectedWalletId) return;

    const wallet = wallets.find(w => w.id === selectedWalletId);
    if (!wallet || wallet.balance < amt) { alert("Insufficient funds in selected wallet."); return; }

    onUpdate(goals.map(g => {
      if (g.id !== selectedGoalId) return g;
      const newPayment: GoalPayment = { id: generateId(), amount: amt, date: paymentDate || new Date().toISOString(), walletId: selectedWalletId };
      const newPayments = [newPayment, ...(g.payments || [])];
      const sum = newPayments.reduce((acc, p) => acc + p.amount, 0) + (g.startingSaved || 0);
      const isCompleted = sum >= g.target;
      if (isCompleted && !g.completed) {
        setTimeout(() => setShowCelebration(g.name), 400); // slight delay
      }
      return { ...g, payments: newPayments, saved: Math.min(sum, g.target), completed: isCompleted };
    }));

    onUpdateWallets(wallets.map(w => w.id === selectedWalletId ? { ...w, balance: w.balance - amt } : w));
    setShowAllocate(false); setSelectedGoalId(null); setAllocateAmt(''); setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = (id: string) => onUpdate(goals.filter(g => g.id !== id));

  const handleDeletePayment = (goalId: string, paymentId: string) => {
    onUpdate(goals.map(g => {
      if (g.id !== goalId) return g;
      const newPayments = (g.payments || []).filter(p => p.id !== paymentId);
      const sum = newPayments.reduce((acc, p) => acc + p.amount, 0) + (g.startingSaved || 0);
      return { ...g, payments: newPayments, saved: Math.min(sum, g.target), completed: sum >= g.target };
    }));
  };

  const activeHistoryGoal = goals.find(g => g.id === historyGoalId);

  if (showHistory && activeHistoryGoal) {
    return (
      <div className="px-6 pt-8 pb-28 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowHistory(false)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground hover:bg-white/10 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Payment History</h1>
            <p className="text-sm text-muted-foreground">{activeHistoryGoal.name}</p>
          </div>
        </div>

        <div className="space-y-3">
          {(!activeHistoryGoal.payments || activeHistoryGoal.payments.length === 0) ? (
            <div className="py-20 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <ReceiptText size={48} className="opacity-20 mb-2" />
              <p>No payments recorded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
              const sorted = [...activeHistoryGoal.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const maxAmt = Math.max(...sorted.map(p => p.amount));
              let latestFound = false;

              return sorted.map((p, idx) => {
                const isLatest = !latestFound;
                if (isLatest) latestFound = true;
                const isLargest = p.amount === maxAmt && p.amount > 0;
                const w = wallets.find(w => w.id === p.walletId);

                return (
                  <GlassCard key={p.id} className="p-4 flex flex-col gap-4 relative bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                    {/* Top Row: Date (Left) & Account (Right) */}
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      {/* DATE */}
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Date & Time</p>
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-base font-bold text-foreground leading-none">{new Date(p.date).toLocaleDateString()}</p>
                          {isLatest && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded pl-1 pr-1 bg-[#4ade80]/20 text-[#4ade80] leading-none text-nowrap">Latest</span>}
                          {isLargest && !isLatest && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded pl-1 pr-1 bg-blue-500/20 text-blue-400 leading-none text-nowrap">Largest</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium leading-none">{new Date(p.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>

                      {/* ACCOUNT */}
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Account</p>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="opacity-80 text-foreground">{w ? getWalletIcon(w.type, 14) : <WalletIcon size={14} />}</span>
                          <p className="text-sm font-bold text-foreground truncate">{w?.name || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Amount (Left) & Trash (Right) */}
                    <div className="flex flex-wrap justify-between items-end border-t border-zinc-100 dark:border-white/5 pt-3">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Amount</p>
                        <p className="text-xl font-bold text-[#4ade80] tabular-nums leading-none block">{formatCurrency(p.amount)}</p>
                      </div>
                      <button onClick={() => handleDeletePayment(activeHistoryGoal.id, p.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </GlassCard>
                );
              });
              })()}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-8 md:pt-12 pb-28 space-y-8 max-w-lg lg:max-w-7xl mx-auto">
      {/* Desktop Header */}
      <div className="hidden lg:block mb-4">
        <h1 className="font-display text-4xl font-black text-foreground mb-2">Goals</h1>
        <p className="text-muted-foreground font-medium">Plan and save for your future milestones.</p>
      </div>
      <div className="flex items-center gap-4 lg:hidden">
        {onBack && (
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground">
            <ChevronLeft size={20} />
          </button>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4ade80]">Personal Goals</p>
          <h1 className="font-display text-3xl font-bold text-foreground">Save for what matters</h1>
          <p className="text-sm text-muted-foreground leading-snug">Track plans like a house, a car, or a trip and move money into them.</p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5 space-y-8">
          <div className="flex justify-between items-center bg-[#4ade80]/10 p-5 rounded-[2rem] border border-[#4ade80]/20">
            <div>
              <p className="text-sm font-bold text-foreground">Have a new plan?</p>
              <p className="text-[10px] text-muted-foreground font-medium">Start saving for your next dream.</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="glass-button px-5 py-3 text-[#4ade80] text-sm font-bold shadow-lg shadow-emerald-500/5">
              <Plus size={16} className="mr-2 inline" /> New goal
            </button>
          </div>

          <GlassCard className="p-7 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mb-1.5">Total saved across goals</p>
                <p className="font-display text-4xl font-bold text-foreground tabular-nums tracking-tight">{formatCurrency(totalSaved)}</p>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mb-8">
              <motion.div className="h-full bg-[#4ade80] shadow-[0_0_15px_rgba(74,222,128,0.3)]" initial={{ width: 0 }} animate={{ width: `${(totalSaved / (totalTarget || 1)) * 100}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground opacity-50 mb-1">Active</p>
                <p className="text-2xl font-bold text-foreground">{activeGoals}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground opacity-50 mb-1">Completed</p>
                <p className="text-2xl font-bold text-foreground">{completedGoals}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground opacity-50 mb-1">Targeted</p>
                <p className="text-2xl font-bold text-foreground">{totalTarget > 1000 ? `${(totalTarget / 1000).toFixed(0)}k` : formatCurrency(totalTarget)}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-7 mt-8 lg:mt-0">
          <p className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-4 px-2">Active Goals</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.filter(g => !g.completed).map(g => {
              const pct = Math.min((g.saved / g.target) * 100, 100);
              const left = Math.max(g.target - g.saved, 0);

              let daysLeftClass = '';
              let daysLeftText = '';
              let daysRemaining = 0;

              if (g.deadline) {
                daysRemaining = Math.ceil((new Date(g.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                if (daysRemaining > 30) { daysLeftClass = 'text-[#4ade80]'; daysLeftText = `${daysRemaining}d remaining`; }
                else if (daysRemaining >= 0) { daysLeftClass = 'text-amber-500'; daysLeftText = `${daysRemaining}d remaining`; }
                else { daysLeftClass = 'text-rose-500'; daysLeftText = 'Overdue'; }
              }

              let nextPayText = '';
              let suggestionText = '';

              if (g.schedule && g.deadline && !g.completed && left > 0) {
                let nextPay = new Date();
                if (g.schedule === 'Weekly') nextPay.setDate(nextPay.getDate() + 7);
                else if (g.schedule === 'Bi-weekly') nextPay.setDate(nextPay.getDate() + 14);
                else if (g.schedule === 'Monthly') nextPay.setDate(nextPay.getDate() + 30);
                else if (g.schedule === 'Custom') nextPay.setDate(nextPay.getDate() + 30);

                const dDate = new Date(g.deadline);
                if (nextPay > dDate) nextPay = dDate;
                nextPayText = nextPay.toLocaleDateString();

                let periods = 1;
                if (g.schedule === 'Weekly') periods = Math.ceil(Math.max(daysRemaining, 1) / 7);
                else if (g.schedule === 'Bi-weekly') periods = Math.ceil(Math.max(daysRemaining, 1) / 14);
                else if (g.schedule === 'Monthly') periods = Math.ceil(Math.max(daysRemaining, 1) / 30);
                else if (g.schedule === 'Custom' && g.customAmount && g.customAmount > 0) periods = Math.ceil(left / g.customAmount);
                periods = Math.max(periods, 1);

                const suggested = g.schedule === 'Custom' ? (g.customAmount || 0) : left / periods;
                suggestionText = `💡 Pay ${formatCurrency(suggested)} / period · ${periods} payments to go`;
              }

              return (
                <GlassCard key={g.id} className="p-6 rounded-[2rem] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                          {g.name}
                        </h3>
                        <p className="text-xs text-muted-foreground opacity-70">{formatCurrency(g.saved)} saved of {formatCurrency(g.target)}</p>
                        {g.schedule && (
                          <span className="inline-block mt-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-wider text-foreground">
                            🔁 {g.schedule}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setHistoryGoalId(g.id); setShowHistory(true); }} className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors pointer-events-auto">
                          <ReceiptText size={16} className="text-muted-foreground" />
                          {(g.payments?.length || 0) > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#4ade80] text-black text-[9px] font-bold flex items-center justify-center">
                              {g.payments?.length}
                            </span>
                          )}
                        </button>
                        <button onClick={() => handleDelete(g.id)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="my-5">
                      <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mb-2.5">
                        <motion.div className="h-full rounded-full bg-[#4ade80]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
                      </div>
                      <div className="flex justify-between items-center tabular-nums">
                        <p className="text-[10px] font-bold text-muted-foreground opacity-50">{Math.round(pct)}% Complete</p>
                        <p className="text-[10px] font-bold text-muted-foreground opacity-50">{formatCurrency(left)} remaining</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {g.deadline && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground flex items-center gap-2 opacity-70"><Calendar size={14} /> Due date</span>
                          <div className="text-right">
                            <span className="text-foreground font-medium">{new Date(g.deadline).toLocaleDateString()}</span>
                            <span className={`ml-2 font-black uppercase text-[9px] ${daysLeftClass}`}>({daysLeftText})</span>
                          </div>
                        </div>
                      )}
                      {nextPayText && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground flex items-center gap-2 opacity-70"><CreditCard size={14} /> Next payment</span>
                          <span className="text-blue-400 font-bold">{nextPayText}</span>
                        </div>
                      )}
                      {suggestionText && (
                        <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] text-muted-foreground font-medium leading-relaxed">
                          {suggestionText}
                        </div>
                      )}
                    </div>
                  </div>

                  {g.completed ? (
                    <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-center text-xs font-bold font-display">
                      Goal Completed! 🎉
                    </div>
                  ) : (
                    <button
                      onClick={() => { setSelectedGoalId(g.id); setShowAllocate(true); }}
                      className="glass-button flex items-center justify-center w-full py-3 text-foreground text-sm font-bold gap-2 shadow-xl shadow-black/5"
                    >
                      <ArrowUpRight size={18} className="text-[#4ade80]" />
                      Allocate Funds
                    </button>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(showAdd || showAllocate || showHistory) && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowAdd(false); setShowAllocate(false); setShowHistory(false); }}
              className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
            />
            {/* ADD MODAL */}
            {showAdd && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="w-full max-w-sm p-6 rounded-[2rem] glass-liquid border border-white/10 shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
                >
                  <h3 className="font-display font-bold text-foreground text-lg mb-4">New Goal</h3>
                  <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    <input type="text" placeholder="Goal name" value={name} onChange={e => { setName(e.target.value); setError(''); }} className="w-full py-3.5 px-4 rounded-xl bg-foreground/5 text-foreground text-base font-semibold outline-none border border-white/5" />
                    <input type="number" placeholder="Target amount" value={target} onChange={e => { setTarget(e.target.value); setError(''); }} className="w-full py-3.5 px-4 rounded-xl bg-foreground/5 text-foreground text-base font-semibold outline-none border border-white/5" />

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Due Date</label>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full py-3.5 px-4 rounded-xl bg-foreground/5 text-foreground text-base font-semibold outline-none border border-white/5 [color-scheme:dark]" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Payment Schedule (Optional)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Weekly', 'Bi-weekly', 'Monthly', 'Custom'].map(f => (
                          <button key={f} onClick={() => setSchedule(f as Goal['schedule'])} className={`py-2 rounded-xl text-xs font-bold border transition-all ${schedule === f ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]' : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'}`}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {schedule === 'Custom' && (
                      <input type="number" placeholder="Custom payment amount" value={customAmount} onChange={e => setCustomAmount(e.target.value)} className="w-full py-3.5 px-4 rounded-xl bg-foreground/5 text-foreground text-base font-semibold outline-none border border-white/5" />
                    )}

                    {newGoalCalcs && (
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Suggested</span>
                          <span className="font-bold text-foreground">{formatCurrency(newGoalCalcs.suggested)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Periods</span>
                          <span className="font-bold text-foreground">{newGoalCalcs.periods}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">1st Payment</span>
                          <span className="font-bold text-[#4ade80]">{new Date(newGoalCalcs.nextPay).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    <input type="number" placeholder="Starting saved (optional)" value={startingSaved} onChange={e => { setStartingSaved(e.target.value); setError(''); }} className="w-full py-3.5 px-4 rounded-xl bg-foreground/5 text-foreground text-base font-semibold outline-none border border-white/5" />

                    {error && <p className="text-[11px] font-bold text-rose-500 px-1">{error}</p>}
                  </div>

                  <div className="flex gap-3 pt-4 mt-2 border-t border-white/5 shrink-0">
                    <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl bg-foreground/5 text-muted-foreground text-sm font-bold transition-colors">Cancel</button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={handleAdd} className="flex-1 py-3 rounded-xl bg-[#4ade80] text-black text-sm font-bold shadow-lg shadow-emerald-500/10">Create</motion.button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ALLOCATE MODAL */}
            {showAllocate && (
              <div className="fixed inset-x-0 bottom-0 z-[130] p-4 pointer-events-none pb-8 sm:pb-4 sm:flex sm:items-center sm:justify-center">
                <motion.div
                  initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full max-w-sm p-6 rounded-[2rem] glass-liquid border border-white/10 shadow-2xl pointer-events-auto sm:mx-auto"
                >
                  <h3 className="font-display font-bold text-foreground text-lg mb-2">Allocate Funds</h3>
                  {selectedGoalId && (
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Goal target</span>
                        <span className="font-bold">{formatCurrency(goals.find(g => g.id === selectedGoalId)?.target || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-bold text-[#4ade80]">{formatCurrency((goals.find(g => g.id === selectedGoalId)?.target || 0) - (goals.find(g => g.id === selectedGoalId)?.saved || 0))}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Select Account</label>
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {wallets.map(w => (
                          <button key={w.id} onClick={() => setSelectedWalletId(w.id)} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${selectedWalletId === w.id ? 'bg-[#4ade80]/10 border-[#4ade80]/30 ring-1 ring-[#4ade80]/20' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-lg opacity-80">{getWalletIcon(w.type, 18)}</span>
                              <div className="text-left">
                                <p className="text-sm font-bold text-foreground">{w.name}</p>
                                <p className="text-[10px] text-muted-foreground">{w.type}</p>
                              </div>
                            </div>
                            <p className="text-sm font-bold text-foreground tracking-tight">{formatCurrency(w.balance)}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Payment Date</label>
                      <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full py-3 px-4 rounded-xl bg-foreground/5 text-foreground text-sm font-semibold outline-none border border-white/5 [color-scheme:dark]" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Amount to Allocate</label>
                      <input type="number" placeholder="0.00" value={allocateAmt} onChange={e => setAllocateAmt(e.target.value)} className="w-full py-3.5 px-4 rounded-xl bg-foreground/5 text-foreground text-base font-semibold outline-none border border-white/5" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 mt-4 border-t border-white/5">
                    <button onClick={() => setShowAllocate(false)} className="flex-1 py-3 rounded-xl bg-foreground/5 text-muted-foreground text-sm font-bold">Cancel</button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={handleAllocate} disabled={!allocateAmt || parseFloat(allocateAmt) <= 0 || parseFloat(allocateAmt) > (wallets.find(w => w.id === selectedWalletId)?.balance || 0)} className="flex-1 py-3 rounded-xl bg-[#4ade80] text-black text-sm font-bold shadow-lg shadow-emerald-500/10 disabled:opacity-30 transition-all">
                      Confirm Payment
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            )}


          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div 
               initial={{ opacity: 0, scale: 0.8, y: 50 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               exit={{ opacity: 0, scale: 0.8, y: -50 }}
               className="relative glass-liquid rounded-[2rem] p-6 max-w-md w-[85vw] border border-white/20 shadow-2xl flex flex-col pt-8 space-y-6"
            >
               <div className="flex items-center gap-5">
                 <img src={squireeCelebrate} alt="Celebrate" className="w-[100px] h-auto object-contain drop-shadow-2xl" />
                 <div className="flex-1 text-left">
                   <h2 className="font-display text-2xl font-black text-foreground mb-1 leading-tight">Goal<br/>Reached!</h2>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     Congratulations! You've completed your <span className="text-foreground font-bold">{showCelebration}</span> goal.
                   </p>
                 </div>
               </div>
               <button onClick={() => setShowCelebration(null)} className="glass-button w-full py-4 text-black bg-[#4ade80] font-bold text-sm shadow-lg shadow-emerald-500/20">
                 Awesome!
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
