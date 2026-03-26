import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Transaction, Wallet, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency, getMonthTransactions } from '@/lib/store';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  transactions: Transaction[];
  wallets: Wallet[];
  onBack?: () => void;
}

export default function HistoryView({ transactions, wallets, onBack }: Props) {
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (selectedWalletId !== 'all') {
      result = result.filter(t => t.walletId === selectedWalletId);
    }
    const sorted = result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filter === 'all') return sorted;
    return sorted.filter(t => t.type === filter);
  }, [transactions, filter, selectedWalletId]);

  // Group by date for list view
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach(t => {
      const dateKey = new Date(t.date).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' });
      const arr = map.get(dateKey) ?? [];
      arr.push(t);
      map.set(dateKey, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Calendar data
  const calendarData = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let monthTxns = getMonthTransactions(transactions, calMonth);
    if (selectedWalletId !== 'all') {
      monthTxns = monthTxns.filter(t => t.walletId === selectedWalletId);
    }

    const days: { day: number; hasExpense: boolean; hasIncome: boolean; txns: Transaction[] }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayTxns = monthTxns.filter(t => {
        const txnDate = new Date(t.date);
        return txnDate.getDate() === d;
      });
      days.push({
        day: d,
        hasExpense: dayTxns.some(t => t.type === 'expense'),
        hasIncome: dayTxns.some(t => t.type === 'income'),
        txns: dayTxns,
      });
    }
    return { firstDay, days };
  }, [calMonth, transactions, selectedWalletId]);

  const monthIncome = useMemo(() => {
    let monthTxns = getMonthTransactions(transactions, calMonth);
    if (selectedWalletId !== 'all') {
      monthTxns = monthTxns.filter(t => t.walletId === selectedWalletId);
    }
    return monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  }, [transactions, calMonth, selectedWalletId]);

  const monthExpense = useMemo(() => {
    let monthTxns = getMonthTransactions(transactions, calMonth);
    if (selectedWalletId !== 'all') {
      monthTxns = monthTxns.filter(t => t.walletId === selectedWalletId);
    }
    return monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  }, [transactions, calMonth, selectedWalletId]);

  const chartData = useMemo(() => {
    if (monthIncome === 0 && monthExpense === 0) return [{ name: 'Empty', value: 1, color: 'rgba(120, 120, 120, 0.1)' }];
    return [
      { name: 'Income', value: monthIncome, color: '#10b981' },
      { name: 'Spent', value: monthExpense, color: '#ef4444' },
    ];
  }, [monthIncome, monthExpense]);

  const activeDays = calendarData.days.filter(d => d.txns.length > 0).length;
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedDayTxns = selectedDay
    ? calendarData.days.find(d => d.day === selectedDay)?.txns ?? []
    : [];

  const prevMonth = () => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1));
  const nextMonth = () => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1));

  const getDynamicFontSize = (amount: number, baseSize: string = 'text-base', isDonut: boolean = false) => {
    const amountStr = formatCurrency(Math.abs(amount)).replace(/[^\d.,₱]/g, '');
    const len = amountStr.length + (amount < 0 ? 1 : 0); // +1 if sign exists

    if (isDonut) {
      if (len > 18) return 'text-[8px]';
      if (len > 15) return 'text-[9px]';
      if (len > 12) return 'text-[10px]';
      if (len > 10) return 'text-xs';
      return 'text-sm';
    }

    if (len > 18) return 'text-[8px]';
    if (len > 15) return 'text-[9px]';
    if (len > 12) return 'text-[10px]';
    if (len > 10) return 'text-xs';
    return baseSize;
  };

  const TransactionItem = ({ t }: { t: Transaction }) => {
    const cats = t.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const cat = cats.find(c => c.id === t.category);
    const wallet = wallets.find(w => w.id === t.walletId);

    return (
      <div className="glass-liquid p-4 flex items-center justify-between border border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center text-xl">
            {cat?.icon ?? <Package size={20} />}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{t.label || cat?.label}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {t.type}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <div className="flex items-center justify-center text-[10px] font-bold text-muted-foreground/60 px-2 py-0.5 w-fit">
            <span>{wallet?.name || 'Unknown'}</span>
          </div>
          <p className={`font-display text-lg font-black tabular-nums ${t.type === 'expense' ? 'text-destructive' : 'text-primary'}`}>
            {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="px-6 pt-8 md:pt-12 pb-28 space-y-6 max-w-lg lg:max-w-7xl mx-auto">

      <div className="flex items-center justify-between lg:justify-end">
        <h1 className="font-display text-2xl font-bold text-foreground lg:hidden">History</h1>
        <div className="flex gap-1 p-1 glass-frosted rounded-xl bg-muted/20">
          <button onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}>
            List
          </button>
          <button onClick={() => setViewMode('calendar')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}>
            Calendar
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7 space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center gap-4 lg:hidden">
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center shadow-sm border border-zinc-500/10 text-muted-foreground active:scale-95 transition-transform"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <div>
                <p className="text-[10px] text-primary font-bold uppercase tracking-[0.15em]">Monthly Calendar</p>
                <h2 className="font-display text-2xl font-black text-foreground">History by date</h2>
              </div>
            </div>

            <div className="glass-liquid p-6 border border-white/5 shadow-2xl space-y-6">
              {/* Month selection */}
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={prevMonth}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={24} />
                </button>

                <div className="text-center">
                  <p className="font-display text-xl font-black text-foreground">
                    {calMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-[11px] font-bold text-muted-foreground/50">{activeDays} active days this month</p>
                </div>

                <button
                  onClick={nextMonth}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="py-2">
                {/* Calendar grid titles */}
                <div className="grid grid-cols-7 gap-1 text-center mb-6">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                    <span key={d} className="text-[10px] text-muted-foreground/50 font-black tracking-widest">{d}</span>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-y-6 gap-x-1">
                  {Array.from({ length: calendarData.firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-10" />
                  ))}
                  {calendarData.days.map(d => {
                    const isToday = d.day === new Date().getDate() && calMonth.getMonth() === new Date().getMonth() && calMonth.getFullYear() === new Date().getFullYear();
                    const isSelected = selectedDay === d.day;
                    const hasData = d.hasExpense || d.hasIncome;

                    return (
                      <div key={d.day} className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => setSelectedDay(d.day === selectedDay ? null : d.day)}
                          className={`w-10 h-10 rounded-full text-xs font-black relative transition-all ${isSelected
                            ? 'bg-primary/10 text-primary border border-primary ring-1 ring-primary ring-offset-2'
                            : isToday
                              ? 'bg-muted/50 text-foreground'
                              : 'text-muted-foreground hover:bg-muted/30'
                            }`}
                        >
                          {d.day}
                        </button>
                        {hasData && (
                          <div className="flex gap-1 h-1.5">
                            {d.hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/20" />}
                            {d.hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-destructive shadow-sm shadow-destructive/20" />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Accounts Filter */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-muted-foreground/40 tracking-widest uppercase px-1">Accounts</p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                <button
                  onClick={() => setSelectedWalletId('all')}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${selectedWalletId === 'all'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-muted/30 text-muted-foreground border border-zinc-500/5 hover:bg-muted/50'}`}
                >
                  All
                </button>
                {wallets.map(w => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${selectedWalletId === w.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-muted/30 text-muted-foreground border border-zinc-500/5 hover:bg-muted/50'}`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8 mt-6 lg:mt-0">
            {/* Financial Summary Card with Donut Chart */}
            <div className="bg-zinc-500/5 dark:bg-white/5 rounded-[2.5rem] p-6 flex flex-col items-center gap-6 relative overflow-hidden border border-white/5 shadow-xl">
              <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase self-start px-2 opacity-50">Monthly Summary</p>
              <div className="flex items-center gap-8 w-full">
                <div className="w-28 h-28 relative flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={48}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        startAngle={90}
                        endAngle={450}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
                    <p className={`font-black tabular-nums leading-tight ${getDynamicFontSize(monthIncome - monthExpense, 'text-xs', true)} ${monthIncome - monthExpense >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {formatCurrency(Math.abs(monthIncome - monthExpense)).replace(/[^\d.,₱]/g, '')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-[10px] font-black text-muted-foreground/40 tracking-widest uppercase leading-none mb-1">Income</p>
                      <p className={`font-black text-primary tabular-nums leading-none ${getDynamicFontSize(monthIncome)}`}>
                        +{formatCurrency(monthIncome).replace(/[^\d.,₱]/g, '')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive shrink-0" />
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-[10px] font-black text-muted-foreground/40 tracking-widest uppercase leading-none mb-1">Spent</p>
                      <p className={`font-black text-destructive tabular-nums leading-none ${getDynamicFontSize(monthExpense)}`}>
                        -{formatCurrency(monthExpense).replace(/[^\d.,₱]/g, '')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected day transactions */}
            <div className="space-y-4">
              <p className="section-label px-1">
                {selectedDay ? `${calMonth.toLocaleDateString('en', { month: 'long' })} ${selectedDay}` : 'All Transactions'}
              </p>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-10">
                {(selectedDay ? selectedDayTxns : grouped.flatMap(g => g[1]).slice(0, 10)).length === 0 ? (
                  <div className="glass-frosted p-8 text-center border border-white/5 opacity-40">
                    <p className="text-xs text-muted-foreground font-medium">No activity for this day.</p>
                  </div>
                ) : (
                  (selectedDay ? selectedDayTxns : filtered.slice(0, 20)).map(t => (
                    <TransactionItem key={t.id} t={t} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Filter Tabs */}
          <div className="flex p-1 glass-frosted rounded-2xl bg-muted/20">
            {(['all', 'expense', 'income'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${filter === f
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {grouped.length === 0 && (
            <div className="glass-frosted p-8 text-center border border-white/5">
              <p className="text-sm text-muted-foreground font-medium">No transactions found.</p>
            </div>
          )}

          <div className="space-y-8">
            {grouped.map(([date, txns]) => (
              <div key={date}>
                <p className="section-label mb-3">{date}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {txns.map(t => (
                    <TransactionItem key={t.id} t={t} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
