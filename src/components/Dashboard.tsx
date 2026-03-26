import { useMemo, useState } from 'react';
import { Plus, Minus, Bell, Settings, ArrowRight, Wallet as WalletIcon, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';
import BudgetManage from './BudgetManage';
import RecentTransactions from './RecentTransactions';
import TransactionTable from './TransactionTable';
import SpentTodayCard from './SpentTodayCard';
import MascotGreeting from './MascotGreeting';
import NotificationPanel from './NotificationPanel';
import {
  Transaction, TransactionType, Wallet, Budget, Goal, Debt, RecurringEntry, AppNotification, AppSettings,
  formatCurrency, getTodayTransactions, getMonthTransactions,
  getLast7DaysData, getDaysUntilPayday, getSquireeGreeting,
} from '@/lib/store';
import logo from '@/assets/kwartrack-logo.png';
import squireeImg from '@/assets/squiree-mascot.png';
import squireeMascotWallet from '@/assets/squiree-mascot-wallet.png';

interface DashboardProps {
  transactions: Transaction[];
  wallets: Wallet[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  recurring: RecurringEntry[];
  notifications: AppNotification[];
  settings: AppSettings;
  onAddClick: (type?: TransactionType) => void;
  onGoalsClick: () => void;
  onDebtClick: () => void;
  onBudgetsUpdate: (b: Budget[]) => void;
  onNotificationsUpdate: (n: AppNotification[]) => void;
  onSettingsClick: () => void;
  onWalletsClick: () => void;
}

export default function Dashboard({
  transactions, wallets, budgets, goals, debts, recurring,
  notifications, settings,
  onAddClick, onGoalsClick, onDebtClick, onBudgetsUpdate, onNotificationsUpdate, onSettingsClick, onWalletsClick
}: DashboardProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMascotBubble, setShowMascotBubble] = useState(false);

  const totalBalance = useMemo(() => wallets.reduce((s, w) => s + w.balance, 0), [wallets]);
  const todayTxns = useMemo(() => getTodayTransactions(transactions), [transactions]);
  const spentToday = useMemo(() => todayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [todayTxns]);
  const weekData = useMemo(() => getLast7DaysData(transactions), [transactions]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const weeklyBudget = settings.weeklyBudget;
  const weeklySpent = useMemo(() => weekData.reduce((sum, d) => sum + d.expense, 0), [weekData]);
  const largestExpenseLabel = useMemo(() => {
    const expensesToday = todayTxns.filter(t => t.type === 'expense');
    if (expensesToday.length === 0) return 'None';
    const largest = expensesToday.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
    return `${largest.category} ₱${largest.amount}`;
  }, [todayTxns]);

  const daysUntilPayday = getDaysUntilPayday(settings);
  const unreadCount = notifications.filter(n => !n.read).length;
  const mascotMessage = useMemo(() => getSquireeGreeting(transactions, budgets, settings), [transactions, budgets, settings]);

  const activeDebt = debts.find(d => d.originalAmount > d.paidAmount);
  const firstGoal = goals[0];

  const handleMarkRead = (id: string) => {
    onNotificationsUpdate(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const isDark = settings.theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-white' : ' text-slate-900'}`}>

      {/* ---------------- MOBILE LAYOUT ---------------- */}
      <div className="md:hidden pb-48 relative transition-colors duration-500 overflow-x-hidden">
        {/* Inverted "Curtain" Header Section */}
        <div className={`pb-12 pt-10 px-6 rounded-b-[3.5rem] shadow-2xl transition-colors duration-500 ${isDark ? 'bg-white text-slate-900' : 'bg-[#0d0d0d] text-white'} relative z-10`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-white/50'}`}>{greeting}</p>
              <h1 className="font-display text-2xl font-black leading-none">
                {settings.userName || 'Kwartrack User'}
              </h1>
            </div>
            <div className="flex gap-2">
              <button className={`w-10 h-10 flex items-center justify-center relative ${isDark ? 'text-slate-400 hover:text-slate-900' : 'text-white/60 hover:text-white'}`} onClick={() => setShowNotifs(true)}>
                <Bell size={22} />
                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-current" />}
              </button>
              <button className={`w-10 h-10 flex items-center justify-center ${isDark ? 'text-slate-400 hover:text-slate-900' : 'text-white/60 hover:text-white'}`} onClick={onSettingsClick}>
                <Settings size={22} />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center mb-10">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-slate-400' : 'text-white/40'}`}>Total Balance</p>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-5xl font-black tabular-nums tracking-tighter">
                ₱{Math.floor(totalBalance).toLocaleString()}
              </span>
              <span className={`font-display text-3xl font-black opacity-30 tabular-nums`}>
                .{(totalBalance % 1).toFixed(2).split('.')[1]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onAddClick('income')}
              className="py-5 rounded-full bg-white/10 border border-white/5 font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              Income
            </button>
            <button
              onClick={() => onAddClick('expense')}
              className="py-5 rounded-full bg-white/10 border border-white/5 font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              Expense
            </button>
          </div>
        </div>

        <div className="relative z-0 space-y-8 px-6 pt-10">
          <SpentTodayCard
            spentToday={spentToday}
            weeklyBudget={weeklyBudget}
            weeklySpent={weeklySpent}
            largestExpenseLabel={largestExpenseLabel}
            transactionsToday={todayTxns.length}
            currencySymbol="₱"
          />
          <p className="section-label">Recent Transactions</p>
          <RecentTransactions transactions={transactions.slice(-5).reverse()} wallets={wallets} />
        </div>
      </div>

      {/* ---------------- DESKTOP LAYOUT ---------------- */}
      <div className={`hidden md:flex flex-col h-full overflow-hidden ${isDark ? 'dark' : ''}`}>

        <div className="flex-1 grid grid-cols-[600px_1fr] overflow-hidden">
          {/* LEFT SIDEBAR - Floating Style */}
          <div className="p-8 h-full flex flex-col">
            <div className={`flex-1 p-8 rounded-[3rem] border flex flex-col gap-8 transition-colors duration-300 shadow-sm ${isDark ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className={`font-display text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>My Account</h2>
                <button
                  onClick={onWalletsClick}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/40' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}
                >
                  Manage
                </button>
              </div>

              {/* TOTAL BALANCE CARD (Matched to WalletView) */}
              <div className="relative w-full aspect-[1.5/1]">
                <div className="glass-premium-card w-full h-full p-8 flex flex-col justify-between relative group overflow-hidden shadow-2xl">
                  {/* Visual Elements: Logo */}
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

                  {/* Squiree Background element */}
                  <div className="absolute top-0 right-0 h-full w-[60%] opacity-20 pointer-events-none select-none">
                    <img src={squireeMascotWallet} alt="" className="w-full h-full object-contain object-right brightness-110" />
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-primary' : 'bg-slate-400'}`} />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              </div>

              <div className={`h-[1px] w-full my-2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />

              {/* SIDEBAR ACTION BUTTONS */}
              <div className="grid grid-rows-2 gap-4">
                <button
                  onClick={() => onAddClick('income')}
                  className={`py-6 rounded-2xl text-sm tracking-widest glass-liquid-button ${isDark ? 'text-white' : 'text-black'}`}
                >
                  Income
                </button>
                <button
                  onClick={() => onAddClick('expense')}
                  className={`py-6 rounded-2xl text-sm tracking-widest glass-liquid-button ${isDark ? 'text-white' : 'text-black'}`}
                >
                  Expense
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="p-8 pb-8 flex flex-col gap-8 h-full overflow-hidden">

            {/* TOP ROW */}
            <div className="grid grid-cols-12 gap-6 items-stretch shrink-0 h-[280px]">
              <div className="col-span-12 lg:col-span-6 flex flex-col">
                <SpentTodayCard
                  spentToday={spentToday}
                  weeklyBudget={weeklyBudget}
                  weeklySpent={weeklySpent}
                  largestExpenseLabel={largestExpenseLabel}
                  transactionsToday={todayTxns.length}
                  currencySymbol="₱"
                />
              </div>

              <div className="col-span-12 lg:col-span-6 flex flex-col gap-3">
                {/* Goal Card */}
                <div className={`p-4 flex flex-col justify-between group rounded-[2.5rem] border transition-colors duration-300 flex-1 ${isDark ? 'glass-card-dark' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-muted-foreground' : 'text-slate-400'}`}>Goals</p>
                      <h4 className={`text-base font-bold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>{firstGoal?.name || 'Savings Goal'}</h4>
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
                      {firstGoal ? formatCurrency(firstGoal.target) : '₱0'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <WalletIcon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <span className={`text-2xl font-display font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatCurrency(firstGoal?.saved || 0).replace(/[^\d.,]/g, '')}
                        </span>
                        <span className={`text-[10px] font-bold ${isDark ? 'text-muted-foreground/40' : 'text-slate-400'}`}>
                          {formatCurrency(firstGoal?.saved || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`flex justify-between items-center pt-2 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <span className="text-[10px] font-bold text-emerald-500">{Math.round((firstGoal?.saved || 0) / (firstGoal?.target || 1) * 100)}% progress</span>
                    <ArrowRight size={14} className={`transition-all group-hover:translate-x-1 ${isDark ? 'text-white/20 group-hover:text-white' : 'text-slate-300 group-hover:text-slate-900'}`} />
                  </div>
                </div>

                {/* Debt Card */}
                <div className={`p-4 flex flex-col justify-between group rounded-[2.5rem] border transition-colors duration-300 flex-1 ${isDark ? 'glass-card-dark' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? 'text-muted-foreground' : 'text-slate-400'}`}>Debt</p>
                      <h4 className={`text-base font-bold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>{activeDebt?.name || 'Active Debt'}</h4>
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
                      {activeDebt ? formatCurrency(activeDebt.originalAmount) : '₱0'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-6 rounded-md bg-gradient-to-r from-orange-400 to-rose-400 opacity-80" />
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <span className={`text-2xl font-display font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatCurrency(activeDebt ? (activeDebt.originalAmount - activeDebt.paidAmount) : 0).replace(/[^\d.,]/g, '')}
                        </span>
                        <span className={`text-[10px] font-bold ${isDark ? 'text-muted-foreground/40' : 'text-slate-400'}`}>
                          {formatCurrency(activeDebt ? (activeDebt.originalAmount - activeDebt.paidAmount) : 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`flex justify-between items-center pt-2 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <span className="text-[10px] font-bold text-rose-500">-{Math.round(((activeDebt?.originalAmount || 1) - (activeDebt?.paidAmount || 0)) / (activeDebt?.originalAmount || 1) * 100)}% remaining</span>
                    <ArrowRight size={14} className={`transition-all group-hover:translate-x-1 ${isDark ? 'text-white/20 group-hover:text-white' : 'text-slate-300 group-hover:text-slate-900'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: Transactions Table */}
            <div className={`flex-1 min-h-0 pb-4 flex flex-col rounded-[2.5rem] border overflow-hidden transition-colors duration-300 ${isDark ? 'glass-card-dark' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className={`p-6 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <h3 className={`font-display font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Transactions</h3>
                <button className={`text-[10px] font-bold transition-colors ${isDark ? 'text-white/30 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}>Full History &gt;</button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                <TransactionTable transactions={transactions.slice(-10).reverse()} wallets={wallets} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mascot Interaction */}
      <div className="fixed bottom-[6.5rem] md:bottom-8 right-6 md:right-8 z-[100]">
        <AnimatePresence>
          {showMascotBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-full right-0 mb-4 z-[110] w-64"
            >
              <div className={`glass-frosted p-5 shadow-3xl rounded-[1.5rem] rounded-br-none border backdrop-blur-xl transition-colors duration-300 ${isDark ? 'border-white/10 bg-[#1a1a1a]/90' : 'border-slate-200 bg-white/95'}`}>
                <p className={`text-[11px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Squiree</p>
                <p className={`text-xs leading-relaxed font-bold ${isDark ? 'text-white/90' : 'text-slate-700'}`}>{mascotMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowMascotBubble(!showMascotBubble)}
          className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center overflow-hidden group outline-none rounded-full shadow-2xl border-4 transition-colors duration-300 ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-100'}`}
        >
          <img src={squireeImg} alt="Squiree" className="w-[80%] h-[80%] md:w-full md:h-full object-contain filter drop-shadow-xl" />
        </motion.button>
      </div>

      <AnimatePresence>
        {showNotifs && (
          <NotificationPanel
            notifications={notifications}
            daysUntilPayday={daysUntilPayday}
            onMarkRead={handleMarkRead}
            onClose={() => setShowNotifs(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
