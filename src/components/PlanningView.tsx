import { useState } from 'react';
import { Target, CreditCard, Repeat, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GoalsView from './GoalsView';
import DebtView from './DebtView';
import { Goal, Debt, Wallet } from '@/lib/store';

interface PlanningViewProps {
  initialTab?: 'goals' | 'debts';
  goals: Goal[];
  debts: Debt[];
  wallets: Wallet[];
  onUpdateGoals: (goals: Goal[]) => void;
  onUpdateDebts: (debts: Debt[]) => void;
  onUpdateWallets: (wallets: Wallet[]) => void;
  onBack?: () => void;
}

export default function PlanningView({
  initialTab = 'goals',
  goals,
  debts,
  wallets,
  onUpdateGoals,
  onUpdateDebts,
  onUpdateWallets,
  onBack,
}: PlanningViewProps) {
  const [activeTab, setActiveTab] = useState<'goals' | 'debts'>(initialTab);

  const tabs = [
    { id: 'goals', label: 'Goals', icon: <Target size={14} /> },
    { id: 'debts', label: 'Debt', icon: <CreditCard size={14} /> },
  ] as const;

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* Top Segmented Control */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-8 pt-10 pb-4">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <button onClick={onBack} className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground active:scale-90 transition-transform">
              <ChevronLeft size={20} />
            </button>
          )}
          <h1 className="font-display text-2xl font-black text-foreground tracking-tighter">Planning</h1>
        </div>

        <div className="flex p-1 rounded-2xl bg-foreground/5 border border-foreground/5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="planning-tab-bg"
                    className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'goals' && (
              <GoalsView
                goals={goals}
                wallets={wallets}
                onUpdate={onUpdateGoals}
                onUpdateWallets={onUpdateWallets}
              />
            )}
            {activeTab === 'debts' && (
              <DebtView
                debts={debts}
                wallets={wallets}
                onUpdate={onUpdateDebts}
                onUpdateWallets={onUpdateWallets}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
