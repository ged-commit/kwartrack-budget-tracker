import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import { AppNotification } from '@/lib/store';

interface Props {
  notifications: AppNotification[];
  daysUntilPayday: number;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

const typeColors: Record<string, string> = {
  budget: 'text-gold-glow',
  debt: 'text-destructive',
  goal: 'text-primary',
  recurring: 'text-primary',
  info: 'text-muted-foreground',
};

const typeIcons: Record<string, string> = {
  budget: '📊',
  debt: '💳',
  goal: '🎯',
  recurring: '🔄',
  info: 'ℹ️',
};

export default function NotificationPanel({ notifications, daysUntilPayday, onMarkRead, onClose }: Props) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className="fixed top-24 right-4 left-4 md:left-auto md:w-96 z-[70] bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white overflow-hidden max-h-[70vh] flex flex-col"
      >
        <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between bg-white/50">
          <div>
            <h2 className="font-display text-lg font-bold text-zinc-900 leading-tight">Notifications</h2>
            <p className="text-[10px] text-zinc-500 font-medium">{notifications.filter(n => !n.read).length} unread messages</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 text-zinc-500 hover:bg-black/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          {/* Payday Countdown */}
          <div className="p-4 bg-[#59735B] rounded-[1.5rem] shadow-sm relative overflow-hidden flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 bg-[#4A604C]">
              🌿
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-[#1a331c]">Payday Countdown</p>
              <p className="text-xs font-semibold text-[#83a685] mt-0.5">
                {daysUntilPayday} {daysUntilPayday === 1 ? 'day' : 'days'} remaining until next payday!
              </p>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <span className="text-4xl mb-3 block">📭</span>
              <p className="text-sm font-medium text-zinc-600">All caught up!</p>
              <p className="text-xs text-zinc-400 mt-1">No new notifications right now.</p>
            </div>
          ) : (
            notifications.map(n => (
              <GlassCard
                key={n.id}
                className={`p-4 transition-all ${!n.read ? 'bg-white border-primary/20 shadow-sm' : 'bg-white/40 border-transparent opacity-70 hover:opacity-100'}`}
                onClick={() => onMarkRead(n.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-zinc-100'}`}>
                    {typeIcons[n.type] ?? 'ℹ️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${!n.read ? 'text-zinc-900' : 'text-zinc-600'}`}>{n.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-zinc-400 font-medium mt-2">
                      {new Date(n.date).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 shadow-[0_0_8px_rgba(26,138,95,0.6)]" />}
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
}
