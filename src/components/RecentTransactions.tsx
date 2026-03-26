import { Transaction, Wallet, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency } from '@/lib/store';
import { Package } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  wallets: Wallet[];
}

export default function RecentTransactions({ transactions, wallets }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="glass-frosted p-8 text-center border border-border/10">
        <p className="text-sm text-muted-foreground font-medium">No transactions yet. Tap + to add one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map(t => {
        const cats = t.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
        const cat = cats.find(c => c.id === t.category);
        const wallet = wallets.find(w => w.id === t.walletId);

        return (
          <div key={t.id} className="glass-liquid p-4 flex items-center justify-between group hover:scale-[1.01] transition-all cursor-pointer border border-border/10 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                {cat?.icon ?? <Package size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{t.label || cat?.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {new Date(t.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <div className="flex items-center justify-center text-[9px] font-bold text-primary/80 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10 w-fit">
                <span>{wallet?.name || 'Unknown'}</span>
              </div>
              <p className={`font-display text-lg font-black tabular-nums transition-colors ${t.type === 'expense' ? 'text-destructive' : 'text-primary'}`}>
                {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
