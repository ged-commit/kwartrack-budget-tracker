import GlassCard from './GlassCard';
import squireeImg from '@/assets/squiree-mascot.png';

interface Props {
  message: string;
  userName?: string;
}

export default function MascotGreeting({ message, userName }: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex gap-0 items-end -ml-1">
      <img src={squireeImg} alt="Squiree" className="w-20 h-20 object-contain flex-shrink-0 z-10 -mr-2" />
      <div className="relative mb-4 flex-1">
        {/* Simple Speech Bubble */}
        <div className="bg-white border-[1.5px] border-[#e1f5eb] rounded-2xl rounded-bl-none p-4 shadow-sm min-w-[140px]">
          <p className="text-[11px] font-black text-[#1a8a5f] uppercase tracking-widest mb-1">Tarsi</p>
          <p className="text-xs text-zinc-600 leading-relaxed font-semibold">{message}</p>
        </div>
        {/* Simple Bubble Arrow - Small triangle peaking from left */}
        <div className="absolute left-[-6px] bottom-0 w-4 h-4 bg-white border-l-[1.5px] border-b-[1.5px] border-[#e1f5eb] transform -rotate-15" 
             style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
      </div>
    </div>
  );
}
