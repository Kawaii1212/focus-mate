import React, { useState } from 'react';
import { MascotPersonaId } from '../../types';
import { PERSONAS } from '../../lib/mascotData';

interface MascotEggProps {
  personaId: MascotPersonaId;
  selected?: boolean;
  revealed?: boolean;
  onClick?: () => void;
  size?: number;
}

export default function MascotEgg({ personaId, selected = false, revealed = true, onClick, size = 140 }: MascotEggProps) {
  const persona = PERSONAS[personaId];
  const [isShaking, setIsShaking] = useState(false);

  const handleClick = () => {
    if (onClick) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      onClick();
    }
  };

  return (
    <div
      className={`flex flex-col items-center gap-2 cursor-pointer transition-transform ${isShaking ? 'animate-egg-shake' : ''} ${selected ? 'scale-110' : 'hover:scale-105'}`}
      onClick={handleClick}
      style={{ mixBlendMode: 'multiply' }}
    >
      <div 
        className={`relative flex items-center justify-center p-2 rounded-3xl transition-all ${selected ? 'ring-4 ring-sky-400' : ''}`} 
        style={{ width: size, height: size }}
      >
         <img src={persona.imagePath} alt={persona.name} className="w-full h-full object-contain" />
      </div>

      <div className="text-center mt-2">
        <p className="text-sm font-semibold text-foreground">{persona.name}</p>
        <p className="text-xs text-muted-foreground max-w-[120px] text-center leading-tight">
          {persona.tagline}
        </p>
      </div>
    </div>
  );
}
