import { useMemo } from 'react';
import { Bell, Settings } from 'lucide-react';
import { AppSettings } from '@/lib/store';

interface GlobalHeaderProps {
  settings: AppSettings;
  onSettingsClick: () => void;
  onNotifsClick?: () => void;
  unreadCount?: number;
}

export default function GlobalHeader({ settings, onSettingsClick, onNotifsClick, unreadCount = 0 }: GlobalHeaderProps) {
  const isDark = settings.theme === 'dark';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <header className="hidden md:flex px-8 pt-8 pb-2 items-center justify-between bg-transparent relative z-10 shrink-0">
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-muted-foreground' : 'text-slate-400'}`}>
          {greeting}
        </p>
        <h1 className={`font-display text-2xl font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {settings.userName || 'Kwartrack User'}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onNotifsClick}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border relative ${isDark ? 'bg-white/5 text-white/40 border-white/5 hover:text-white/70' : 'bg-white text-slate-400 border-slate-200 shadow-sm hover:text-slate-600'}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
        <button
          onClick={onSettingsClick}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${isDark ? 'bg-white/5 text-white/40 border-white/5 hover:text-white/70' : 'bg-white text-slate-400 border-slate-200 shadow-sm hover:text-slate-600'}`}
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
