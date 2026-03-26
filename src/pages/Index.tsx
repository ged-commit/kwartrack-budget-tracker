import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import GlobalHeader from '@/components/GlobalHeader';
import Dashboard from '@/components/Dashboard';
import AddTransaction from '@/components/AddTransaction';
import WalletView from '@/components/WalletView';
import HistoryView from '@/components/HistoryView';
import GoalsView from '@/components/GoalsView';
import DebtView from '@/components/DebtView';
import SettingsView from '@/components/SettingsView';
import PlanningView from '@/components/PlanningView';
import NotificationPanel from '@/components/NotificationPanel';
import {
  useTransactions, useWallets, useBudgets, useGoals, useDebts, useRecurring, useNotifications, useSettings, useGrocerySessions, useCustomPrices,
  Transaction, TransactionType, RecurringEntry, generateId, processRecurringEntries, getDaysUntilPayday
} from '@/lib/store';

export default function Index() {
  const [tab, setTab] = useState('home');
  const [vaultSubTab, setVaultSubTab] = useState<'goals' | 'debts'>('goals');
  const [showAdd, setShowAdd] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [forcedType, setForcedType] = useState<TransactionType | undefined>(undefined);
  const [forcedAmount, setForcedAmount] = useState<number | undefined>(undefined);
  const [forcedLabel, setForcedLabel] = useState<string | undefined>(undefined);
  const [forcedWalletId, setForcedWalletId] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useTransactions();
  const [wallets, setWallets] = useWallets();
  const [budgets, setBudgets] = useBudgets();
  const [goals, setGoals] = useGoals();
  const [debts, setDebts] = useDebts();
  const [recurring, setRecurring] = useRecurring();
  const [notifications, setNotifications] = useNotifications();
  const [settings, setSettings] = useSettings();
  const [grocerySessions, setGrocerySessions] = useGrocerySessions();
  const [customPrices, setCustomPrices] = useCustomPrices();

  // Theme effect
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Handle recurring item marking as processed
  const handleUpdateRecurring = (updated: RecurringEntry[]) => {
    setRecurring(updated);
  };

  const handleSave = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...tx, id: generateId() };
    setTransactions(prev => [...prev, newTx]);
    setWallets(prev =>
      prev.map(w =>
        w.id === tx.walletId
          ? { ...w, balance: Math.max(0, w.balance + (tx.type === 'income' ? tx.amount : -tx.amount)) }
          : w
      )
    );
  };

  const openAddModal = (type?: TransactionType, amount?: number, label?: string, walletId?: string) => {
    setForcedType(type);
    setForcedAmount(amount);
    setForcedLabel(label);
    setForcedWalletId(walletId);
    setShowAdd(true);
  };

  const handleGroceryCheckout = (walletId: string, amount: number, label: string) => {
    openAddModal('expense', amount, label, walletId);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const daysUntilPayday = getDaysUntilPayday(settings);

  const handleMarkRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] md:flex w-full overflow-hidden">
      <SideNav
        active={tab}
        onNavigate={setTab}
        unreadCount={unreadCount}
        onNotifsClick={() => {
          setShowNotifs(true);
          if (unreadCount > 0) {
            setNotifications(notifications.map(n => ({ ...n, read: true })));
          }
        }}
      />
      <div className="flex-1 overflow-y-auto w-full flex flex-col">
        <GlobalHeader
          settings={settings}
          onSettingsClick={() => setTab('settings')}
          onNotifsClick={() => {
            setShowNotifs(true);
            if (unreadCount > 0) {
              setNotifications(notifications.map(n => ({ ...n, read: true })));
            }
          }}
          unreadCount={unreadCount}
        />
        {tab === 'home' && (
          <Dashboard
            transactions={transactions}
            wallets={wallets}
            budgets={budgets}
            goals={goals}
            debts={debts}
            recurring={recurring}
            notifications={notifications}
            settings={settings}
            onAddClick={(type) => openAddModal(type || 'expense')}
            onGoalsClick={() => { setVaultSubTab('goals'); setTab('planning'); }}
            onDebtClick={() => { setVaultSubTab('debts'); setTab('planning'); }}
            onBudgetsUpdate={setBudgets}
            onNotificationsUpdate={setNotifications}
            onSettingsClick={() => setTab('settings')}
            onWalletsClick={() => setTab('wallet')}
          />
        )}
        {tab === 'wallet' && (
          <div className="w-full">
            <WalletView
              transactions={transactions}
              settings={settings}
              wallets={wallets}
              onUpdateWallets={setWallets}
              onAddIncome={() => openAddModal('income')}
              onSettingsClick={() => setTab('settings')}
            />
          </div>
        )}
        {tab === 'history' && (
          <div className="w-full">
            <HistoryView
              transactions={transactions}
              wallets={wallets}
              onBack={() => setTab('home')}
            />
          </div>
        )}
        {tab === 'planning' && (
          <div className="md:hidden">
            <PlanningView
              initialTab={vaultSubTab}
              goals={goals}
              debts={debts}
              wallets={wallets}
              onUpdateGoals={setGoals}
              onUpdateDebts={setDebts}
              onUpdateWallets={setWallets}
              onBack={() => setTab('home')}
            />
          </div>
        )}
        {tab === 'goals' && (
          <div className="w-full">
            <GoalsView
              goals={goals}
              wallets={wallets}
              onUpdate={setGoals}
              onUpdateWallets={setWallets}
            />
          </div>
        )}
        {tab === 'debts' && (
          <div className="w-full">
            <DebtView
              debts={debts}
              wallets={wallets}
              onUpdate={setDebts}
              onUpdateWallets={setWallets}
            />
          </div>
        )}
        {tab === 'settings' && (
          <SettingsView
            settings={settings}
            transactions={transactions}
            onUpdateSettings={setSettings}
            onReload={() => window.location.reload()}
            onBack={() => setTab('home')}
          />
        )}

        {!showAdd && (
          <>
            <div className="bottom-fade-overlay" />
            <BottomNav active={tab} onNavigate={setTab} />
          </>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddTransaction
            wallets={wallets}
            transactions={transactions}
            recurring={recurring}
            customPrices={customPrices}
            onUpdateCustomPrices={setCustomPrices}
            onUpdateRecurring={handleUpdateRecurring}
            onSave={handleSave}
            onClose={() => {
              setShowAdd(false);
              setForcedType(undefined);
              setForcedAmount(undefined);
              setForcedLabel(undefined);
              setForcedWalletId(undefined);
            }}
            forcedType={forcedType}
            forcedAmount={forcedAmount}
            forcedLabel={forcedLabel}
            forcedWalletId={forcedWalletId}
            grocerySessions={grocerySessions}
            onUpdateGrocerySessions={setGrocerySessions}
          />
        )}
      </AnimatePresence>

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
