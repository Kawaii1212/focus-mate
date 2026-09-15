import React, { useState } from 'react';
import { MascotPersonaId } from '../../types';
import { PERSONAS } from '../../lib/mascotData';
import { Lock } from 'lucide-react';

interface MascotEggProps {
  personaId: MascotPersonaId;
  selected?: boolean;
  revealed?: boolean;
  locked?: boolean;
  onClick?: () => void;
  size?: number;
}

export default function MascotEgg({ personaId, selected = false, revealed = true, locked = false, onClick, size = 140 }: MascotEggProps) {
  const persona = PERSONAS[personaId];
  const [isShaking, setIsShaking] = useState(false);

  const handleClick = () => {
    if (locked) return;
    if (onClick) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      onClick();
    }
  };

  return (
    <div
      className={`flex flex-col items-center gap-2 cursor-pointer transition-transform ${locked ? 'opacity-50 cursor-not-allowed' : isShaking ? 'animate-egg-shake' : ''} ${selected ? 'scale-110' : locked ? '' : 'hover:scale-105'}`}
      onClick={handleClick}
    >
      <div
        className={`relative flex items-center justify-center p-2 rounded-3xl transition-all ${selected ? 'ring-4 ring-sky-400' : ''}`}
        style={{ width: size, height: size }}
      >
         <img src={persona.imagePath} alt={persona.name} className="w-full h-full object-contain" />
         {locked && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl">
             <Lock className="w-8 h-8 text-white drop-shadow-lg" />
           </div>
         )}
      </div>

      <div className="text-center mt-2">
        <div className="flex items-center justify-center gap-1">
          <p className="text-sm font-semibold text-foreground">{persona.name}</p>
          {persona.isPremium && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
              PRO
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground max-w-[120px] text-center leading-tight">
          {persona.tagline}
        </p>
      </div>
    </div>
  );
}
