import { Home, Wallet, Clock, ShoppingCart, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  active: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  { id: 'home', icon: Home },
  { id: 'wallet', icon: Wallet },
  { id: 'history', icon: Clock },
  { id: 'settings', icon: Settings },
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-6 left-6 right-6 z-[100] rounded-full glass-liquid safe-bottom p-1 md:hidden">
      <div className="flex items-center justify-between px-1 py-1.5 max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="relative flex items-center justify-center rounded-full transition-all group flex-1 h-[3.2rem]"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-1 rounded-full bg-primary shadow-lg"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
              <tab.icon
                size={20}
                className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
