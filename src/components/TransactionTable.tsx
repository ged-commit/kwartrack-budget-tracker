import { Transaction, Wallet, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency } from '@/lib/store';
import { Package, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface TransactionTableProps {
  transactions: Transaction[];
  wallets: Wallet[];
}

export default function TransactionTable({ transactions, wallets }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground font-medium">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/10">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[20%]">Date and time</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[15%]">Type</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[20%]">Category</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[25%]">Account Type</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[20%] text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/5">
            {transactions.map((t, i) => {
              const cats = t.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
              const cat = cats.find(c => c.id === t.category);
              const wallet = wallets.find(w => w.id === t.walletId);
              const date = new Date(t.date);
              const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              const formattedTime = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

              return (
                <motion.tr 
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="table-row-hover transition-colors group cursor-default"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground transition-colors">{formattedDate}</span>
                      <span className="text-[10px] font-bold text-muted-foreground/50">{formattedTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 text-xs font-bold ${t.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {t.type === 'expense' ? (
                        <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center">
                          <ArrowUpRight size={14} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <ArrowDownLeft size={14} />
                        </div>
                      )}
                      <span className="capitalize">{t.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-muted/20 flex items-center justify-center text-lg">
                        {cat?.icon ?? <Package size={16} />}
                      </div>
                      <span className="text-sm font-bold text-foreground transition-colors">{t.label || cat?.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground/70 bg-muted/20 px-2.5 py-1 rounded-lg border border-border/10">
                        {wallet?.name || 'Unknown'}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                        {wallet?.type || 'Wallet'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-display text-lg font-black tabular-nums transition-colors ${t.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Pill List View */}
      <div className="md:hidden flex flex-col gap-2 px-4 pb-4">
        {transactions.map((t, i) => {
          const cats = t.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
          const cat = cats.find(c => c.id === t.category);
          const date = new Date(t.date);
          const formattedDate = `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}, ${date.getFullYear()}`;

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex justify-between items-center p-4 rounded-3xl bg-foreground/5 hover:bg-foreground/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-black/10 dark:bg-white/5 flex items-center justify-center text-xl shadow-inner">
                  {cat?.icon ?? <Package size={18} />}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-foreground text-[15px]">{cat?.label || 'Transaction'}</span>
                  <span className="text-xs text-muted-foreground capitalize font-medium opacity-80 mt-0.5">{t.type}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`font-bold text-[15px] font-display tabular-nums tracking-tight ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium mt-1 opacity-70">
                  {formattedDate}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
