import { useState, useEffect, useCallback, createElement } from 'react';
import { Utensils, ShoppingCart, Bus, ShoppingBag, FileText, Gamepad2, Pill, BookOpen, Package, HandCoins, CreditCard, Laptop, TrendingUp, Gift, Banknote, Landmark, Smartphone } from 'lucide-react';

// Types
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  label: string;
  date: string; // ISO
  walletId: string;
  recurringId?: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'physical bank' | 'online bank';
  balance: number;
  icon: string;
  provider?: 'gcash' | 'maya' | 'gotyme' | 'none';
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'monthly';
}

export interface GoalPayment {
  id: string;
  amount: number;
  date: string;
  walletId?: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
  notes?: string;
  startingSaved?: number;
  completed?: boolean;
  schedule?: 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Custom';
  customAmount?: number;
  payments?: GoalPayment[];
}

export interface Debt {
  id: string;
  name: string;
  type: 'owe' | 'owed'; // 'owe' = I owe someone, 'owed' = someone owes me
  person: string;
  originalAmount: number;
  paidAmount: number;
  dueDate?: string;
  notes?: string;
  walletId?: string;
  payments: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  walletId?: string;
}

export interface RecurringEntry {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  label: string;
  walletId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  lastProcessed?: string;
  active: boolean;
}

export interface GroceryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  checked: boolean;
}

export interface GrocerySession {
  id: string;
  name: string;
  walletId: string;
  budgetCap: number | null; // null = use wallet balance
  items: GroceryItem[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'budget' | 'debt' | 'goal' | 'recurring' | 'info';
  date: string;
  read: boolean;
}

export interface AppSettings {
  currency: string;
  paydayType: 'weekly' | 'monthly';
  paydayValue: number; // 0-6 for weekly, 1-31 for monthly
  userName: string;
  weeklyBudget: number;
  theme: 'light' | 'dark';
}

export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food', icon: createElement(Utensils, { size: 18 }) },
  { id: 'groceries', label: 'Groceries', icon: createElement(ShoppingCart, { size: 18 }) },
  { id: 'transport', label: 'Transport', icon: createElement(Bus, { size: 18 }) },
  { id: 'shopping', label: 'Shopping', icon: createElement(ShoppingBag, { size: 18 }) },
  { id: 'bills', label: 'Bills', icon: createElement(FileText, { size: 18 }) },
  { id: 'entertainment', label: 'Fun', icon: createElement(Gamepad2, { size: 18 }) },
  { id: 'health', label: 'Health', icon: createElement(Pill, { size: 18 }) },
  { id: 'education', label: 'Education', icon: createElement(BookOpen, { size: 18 }) },
  { id: 'other', label: 'Other', icon: createElement(Package, { size: 18 }) },
];

export const INCOME_CATEGORIES = [
  { id: 'allowance', label: 'Allowance', icon: createElement(HandCoins, { size: 18 }) },
  { id: 'salary', label: 'Salary', icon: createElement(CreditCard, { size: 18 }) },
  { id: 'freelance', label: 'Freelance', icon: createElement(Laptop, { size: 18 }) },
  { id: 'investment', label: 'Investment', icon: createElement(TrendingUp, { size: 18 }) },
  { id: 'gift', label: 'Gift', icon: createElement(Gift, { size: 18 }) },
  { id: 'other_income', label: 'Other', icon: createElement(Package, { size: 18 }) },
];

const DEFAULT_WALLETS: Wallet[] = [
  { id: 'cash', name: 'Cash', type: 'cash', balance: 0, icon: 'cash', provider: 'none' }
];

export const getWalletIcon = (type: string, size = 18) => {
  switch(type) {
    case 'cash': return createElement(Banknote, { size });
    case 'physical bank': return createElement(Landmark, { size });
    case 'online bank': return createElement(Smartphone, { size });
    default: return createElement(Banknote, { size });
  }
};

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'PHP',
  paydayType: 'monthly',
  paydayValue: 15,
  userName: '',
  weeklyBudget: 0,
  theme: 'light',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`kwartrack_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  localStorage.setItem(`kwartrack_${key}`, JSON.stringify(value));
}

export function useStore<T>(key: string, fallback: T, migrate?: (data: any) => T) {
  const [data, setData] = useState<T>(() => {
    const loaded = loadFromStorage(key, fallback);
    return migrate ? migrate(loaded) : loaded;
  });

  const update = useCallback((updater: T | ((prev: T) => T)) => {
    setData(prev => {
      const next = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
      saveToStorage(key, next);
      return next;
    });
  }, [key]);

  return [data, update] as const;
}

export function useTransactions() {
  return useStore<Transaction[]>('transactions', []);
}

export function useWallets() {
  return useStore<Wallet[]>('wallets', DEFAULT_WALLETS);
}

export function useBudgets() {
  return useStore<Budget[]>('budgets', []);
}

export function useGoals() {
  return useStore<Goal[]>('goals', []);
}

export function useDebts() {
  return useStore<Debt[]>('debts', []);
}

export function useRecurring() {
  return useStore<RecurringEntry[]>('recurring', []);
}

export function useNotifications() {
  return useStore<AppNotification[]>('notifications', []);
}

export function useGrocerySessions() {
  return useStore<GrocerySession[]>('grocery_sessions', []);
}

export function useCustomPrices() {
  return useStore<Record<string, number>>('custom_prices', {});
}

export function useSettings() {
  const migrate = (data: any): AppSettings => {
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      theme: data?.theme || 'dark',
    };
  };
  return useStore<AppSettings>('settings', DEFAULT_SETTINGS, migrate);
}

// Helpers
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getMonthTransactions(transactions: Transaction[], date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getTodayTransactions(transactions: Transaction[]) {
  const today = new Date().toISOString().split('T')[0];
  return transactions.filter(t => t.date.startsWith(today));
}

export function getLast7DaysData(transactions: Transaction[]) {
  const days: { label: string; expense: number; income: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en', { weekday: 'short' }).charAt(0);
    const dayTxns = transactions.filter(t => t.date.startsWith(dateStr));
    days.push({
      label: dayLabel,
      expense: dayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      income: dayTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    });
  }
  return days;
}

export function getDaysUntilPayday(settings: AppSettings) {
  const { paydayType = 'monthly', paydayValue = 15 } = settings;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const safePaydayValue = isNaN(paydayValue) ? 15 : paydayValue;

  if (paydayType === 'weekly') {
    const currentDay = today.getDay(); // 0-6 (Sun-Sat)
    const targetDiff = safePaydayValue - currentDay;
    const finalDiff = targetDiff < 0 ? targetDiff + 7 : targetDiff;
    return finalDiff;
  } else {
    // Monthly
    const dayOfMonth = Math.min(Math.max(1, safePaydayValue), 31);
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let nextPayday: Date;
    if (currentDay <= dayOfMonth) {
      nextPayday = new Date(currentYear, currentMonth, dayOfMonth);
    } else {
      nextPayday = new Date(currentYear, currentMonth + 1, dayOfMonth);
    }

    if (isNaN(nextPayday.getTime())) return 0; // Fallback

    const diff = nextPayday.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}

export function getSquireeGreeting(transactions: Transaction[], budgets: Budget[], settings: AppSettings) {
  const hour = new Date().getHours();
  const monthTxns = getMonthTransactions(transactions);
  const monthExpenses = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const tips = [
    "Looking good! Keep tracking your expenses daily.",
    "Small savings add up! Try cutting one unnecessary expense today.",
    "Have you checked your budgets this week?",
    "Remember to log every transaction for accurate tracking!",
    "Setting goals helps you stay motivated. Try creating one!",
  ];

  // Check budget warnings
  for (const b of budgets) {
    const spent = monthTxns.filter(t => t.type === 'expense' && t.category === b.category).reduce((s, t) => s + t.amount, 0);
    const pct = (spent / b.limit) * 100;
    if (pct >= 90) {
      const cat = EXPENSE_CATEGORIES.find(c => c.id === b.category);
      return `Heads up! Your ${cat?.label ?? b.category} budget is almost maxed out.`;
    }
    if (pct >= 70) {
      const cat = EXPENSE_CATEGORIES.find(c => c.id === b.category);
      return `Your ${cat?.label ?? b.category} budget is at ${Math.round(pct)}%. Might want to slow down there!`;
    }
  }

  if (monthExpenses === 0) return "No expenses logged this month yet. Start tracking!";

  const daysLeft = getDaysUntilPayday(settings);
  if (daysLeft <= 3) return `Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} until payday! Hang in there! 💪`;

  return tips[Math.floor(Math.random() * tips.length)];
}

// Backup & Restore
export function exportData() {
  const keys = ['transactions', 'wallets', 'budgets', 'goals', 'debts', 'recurring', 'notifications', 'settings'];
  const data: Record<string, unknown> = {};
  keys.forEach(k => {
    const raw = localStorage.getItem(`kwartrack_${k}`);
    if (raw) data[k] = JSON.parse(raw);
  });
  return JSON.stringify(data, null, 2);
}

export function importData(jsonStr: string) {
  const data = JSON.parse(jsonStr);
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(`kwartrack_${key}`, JSON.stringify(value));
  });
}

export function exportCSV(transactions: Transaction[]) {
  const headers = ['Date', 'Type', 'Amount', 'Category', 'Label', 'Wallet'];
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString(),
    t.type,
    t.amount.toString(),
    t.category,
    t.label,
    t.walletId,
  ]);
  return [headers, ...rows].map(r => r.join(',')).join('\n');
}

// Get recurring entries that are due for processing
export function getDueRecurringEntries(recurring: RecurringEntry[]) {
  const today = new Date().toISOString().split('T')[0];
  return recurring.filter(r => {
    if (!r.active) return false;
    const lastDate = r.lastProcessed ? new Date(r.lastProcessed) : new Date(r.startDate);
    const now = new Date();

    if (lastDate.toISOString().split('T')[0] >= today) return false;

    if (r.frequency === 'daily') return true;
    if (r.frequency === 'weekly') {
      const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 7;
    }
    if (r.frequency === 'monthly') {
      return now.getMonth() !== lastDate.getMonth() || now.getFullYear() !== lastDate.getFullYear();
    }
    return false;
  });
}

// Get frequent transaction labels/categories for suggestions
export function getFrequentItems(transactions: Transaction[], type: TransactionType, limit = 5) {
  const counts: Record<string, { count: number; tx: Transaction }> = {};
  
  transactions
    .filter(t => t.type === type)
    .forEach(t => {
      const key = `${t.label.toLowerCase()}_${t.category}`;
      if (!counts[key]) {
        counts[key] = { count: 0, tx: t };
      }
      counts[key].count++;
    });

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(item => item.tx);
}

// Process recurring entries (Keeping for compatibility, but moving to manual/suggested flow)
export function processRecurringEntries(
  recurring: RecurringEntry[],
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void,
  onUpdateRecurring: (entries: RecurringEntry[]) => void
) {
  const due = getDueRecurringEntries(recurring);
  if (due.length === 0) return;

  const today = new Date().toISOString().split('T')[0];
  const newRecurring = recurring.map(r => {
    const isDue = due.find(d => d.id === r.id);
    if (isDue) {
      onAddTransaction({
        type: r.type,
        amount: r.amount,
        category: r.category,
        label: r.label,
        walletId: r.walletId,
        date: new Date().toISOString(),
        recurringId: r.id,
      });
      return { ...r, lastProcessed: today };
    }
    return r;
  });

  onUpdateRecurring(newRecurring);
}
