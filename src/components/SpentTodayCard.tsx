import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Activity } from 'lucide-react';

interface SpentTodayCardProps {
  spentToday: number;
  weeklyBudget: number;
  weeklySpent: number;
  largestExpenseLabel: string;
  transactionsToday: number;
  currencySymbol: string;
}

export default function SpentTodayCard({
  spentToday,
  weeklyBudget,
  weeklySpent,
  largestExpenseLabel,
  transactionsToday,
  currencySymbol
}: SpentTodayCardProps) {
  // Calculations
  const spentTodayPct = weeklyBudget > 0 ? (spentToday / weeklyBudget) * 100 : 0;
  const remainingThisWeek = Math.max(weeklyBudget - weeklySpent, 0);

  // Formatting
  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val).replace('PHP', currencySymbol).trim();
  };

  const getDynamicFontSize = (text: string, base: string = 'text-sm') => {
    if (text.length > 22) return 'text-[9px]';
    if (text.length > 18) return 'text-[10px]';
    if (text.length > 14) return 'text-xs';
    return base;
  };

  // Parse largest expense label for better formatting
  const { cat, amt } = useMemo(() => {
    if (!largestExpenseLabel || largestExpenseLabel === 'None') return { cat: 'None', amt: null };
    const parts = largestExpenseLabel.split(' ₱');
    return { cat: parts[0], amt: parts[1] ? `₱${parts[1]}` : null };
  }, [largestExpenseLabel]);

  return (
    <div className="glass-liquid h-full overflow-hidden relative group border border-border/10 shadow-2xl transition-colors duration-300">
      <div className="p-5 h-full flex flex-col">
        {/* Header Row */}
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Spent today</span>
          <div className="px-3 py-1 rounded-full bg-primary/10 text-[10px] font-black border border-primary/20 text-primary">
            {Math.round(spentTodayPct)}% of week
          </div>
        </div>

        {/* Hero Amount */}
        <div className="mb-4">
          <p className="font-display text-4xl font-black text-foreground leading-none tracking-tight">
            {formatAmount(spentToday)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full rounded-full bg-black/10 overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(spentTodayPct, 100)}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className={`h-full rounded-full ${spentTodayPct > 100 ? 'bg-destructive' : 'bg-primary'} shadow-lg`}
          />
        </div>

        {/* Progress Labels */}
        <div className="flex justify-between items-center mb-6 px-1">
          <span className="text-[10px] font-bold text-muted-foreground opacity-60 tracking-wide">Budget: {formatAmount(weeklyBudget)}</span>
          <span className={`text-[10px] font-black uppercase tracking-wider ${remainingThisWeek > 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatAmount(remainingThisWeek)} left this week
          </span>
        </div>

      </div>
    </div>
  );
}
