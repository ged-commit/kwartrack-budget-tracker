import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'gold';
  onClick?: () => void;
}

export default function GlassCard({ children, className, variant = 'default', onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-frosted transition-all duration-300',
        variant === 'gold' && 'glass-gold',
        onClick && 'glass-hover cursor-pointer active:scale-95',
        className
      )}
    >
      <div className="p-6 relative z-10">
        {children}
      </div>
    </div>
  );
}
