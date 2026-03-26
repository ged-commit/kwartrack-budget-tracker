import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Budget, Transaction, EXPENSE_CATEGORIES, formatCurrency, generateId, getMonthTransactions } from '@/lib/store';

interface Props {
  budgets: Budget[];
  transactions: Transaction[];
  onUpdate: (budgets: Budget[]) => void;
  isAdding: boolean;
  onCloseAdd: () => void;
}

export default function BudgetManage({ budgets, transactions, onUpdate, isAdding, onCloseAdd }: Props) {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');

  const monthTxns = getMonthTransactions(transactions);
  const usedCategories = budgets.map(b => b.category);
  const availableCategories = EXPENSE_CATEGORIES.filter(c => !usedCategories.includes(c.id));

  const handleAdd = () => {
    if (!category || !limit) return;
    onUpdate([...budgets, { id: generateId(), category, limit: parseFloat(limit), period: 'monthly' }]);
    setCategory('');
    setLimit('');
    onCloseAdd();
  };

  const handleDelete = (id: string) => {
    onUpdate(budgets.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-3">
      {budgets.map(b => {
        const spent = monthTxns.filter(t => t.type === 'expense' && t.category === b.category).reduce((s, t) => s + t.amount, 0);
        const pct = Math.min((spent / b.limit) * 100, 100);
        const cat = EXPENSE_CATEGORIES.find(c => c.id === b.category);
        const remaining = b.limit - spent;
        const isWarning = pct >= 80;

        return (
          <div key={b.id} className="p-5 rounded-[1.75rem] glass-frosted border border-border shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {cat?.label ?? b.category}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  {formatCurrency(spent)} / {formatCurrency(b.limit)}
                </span>
                <button onClick={() => handleDelete(b.id)} className="text-muted-foreground hover:text-rose-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden mb-3">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {remaining > 0 ? `${formatCurrency(remaining)} left this month` : 'Budget exceeded!'}
            </p>
          </div>
        );
      })}

      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onCloseAdd}
              className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-sm p-7 rounded-[2.5rem] glass-frosted border border-border shadow-3xl pointer-events-auto"
              >
                <h3 className="font-display font-bold text-foreground text-xl mb-6">Add Monthly Budget</h3>
                
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {availableCategories.map(c => (
                    <button key={c.id} onClick={() => setCategory(c.id)}
                      className={`flex flex-col items-center gap-2 py-3.5 rounded-[1.25rem] text-xs font-medium transition-all ${category === c.id 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                        : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'
                        }`}>
                      <span className="text-2xl">{c.icon}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest">{c.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mb-6 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₱</span>
                  <input type="number" placeholder="Enter amount..." value={limit} onChange={e => setLimit(e.target.value)}
                    className="w-full py-4 pl-8 pr-4 rounded-xl bg-foreground/5 text-foreground text-base font-semibold placeholder:text-muted-foreground/30 outline-none focus:ring-1 focus:ring-primary transition-all border border-foreground/5" />
                </div>

                <div className="flex gap-3">
                  <button onClick={onCloseAdd} className="flex-1 py-4 rounded-2xl bg-foreground/5 text-muted-foreground text-sm font-bold hover:bg-foreground/10 transition-colors border border-foreground/5">Cancel</button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={handleAdd} className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-xl shadow-primary/20">Save Budget</motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
