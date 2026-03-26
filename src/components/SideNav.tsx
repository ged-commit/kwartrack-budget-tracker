import { Home, Wallet, Clock, Target, CreditCard, Bell, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/kwartrack-logo.png';

interface SideNavProps {
  active: string;
  onNavigate: (tab: string) => void;
  unreadCount?: number;
  onNotifsClick?: () => void;
}

const blocks = [
  {
    id: 'main',
    items: [
      { id: 'home', icon: Home },
      { id: 'wallet', icon: Wallet },
      { id: 'history', icon: Clock },
      { id: 'goals', icon: Target },
      { id: 'debts', icon: CreditCard },
    ]
  }
];

export default function SideNav({ active, onNavigate, unreadCount = 0, onNotifsClick }: SideNavProps) {
  return (
    <aside className="hidden md:flex flex-col w-[100px] h-full bg-[hsl(var(--background))] py-8 items-center border-r border-border/10">
      {/* Logo */}
      <div className="mb-10 w-12 h-12 flex items-center justify-center">
        <img src={logo} alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
      </div>

      {/* Scrollable Nav Area if needed, though usually fixed */}
      <div className="flex-1 flex flex-col items-center gap-6 w-full px-4 overflow-y-auto no-scrollbar pb-6">

        {blocks.map(block => (
          <div key={block.id} className="w-full bg-[#1b2521] rounded-[1.5rem] p-2 flex flex-col items-center gap-2 shadow-lg border border-white/5 relative">
            {/* Glossy overlay mimicking image */}
            <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

            {block.items.map(tab => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all group z-10 ${isActive ? 'bg-primary shadow-md shadow-primary/20' : 'hover:bg-white/5'}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidenav-active"
                      className="absolute inset-0 bg-primary rounded-2xl"
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  )}
                  <tab.icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-primary-foreground' : 'text-[#82a494] group-hover:text-white'}`}
                  />
                </button>
              );
            })}
          </div>
        ))}

        {/* Logout Block */}
        <div className="w-full bg-[#1b2521] rounded-2xl p-2 flex flex-col items-center shadow-lg border border-white/5 relative">
          <button
            className="relative w-12 h-12 flex items-center justify-center rounded-xl transition-all group z-10 hover:bg-white/5"
            title="Log Out"
          >
            <LogOut size={20} className="text-[#82a494] group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  );
}
