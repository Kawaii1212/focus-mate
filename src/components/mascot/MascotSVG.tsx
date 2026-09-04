import React from 'react';
import { MascotPersonaId, MascotStage, MascotState } from '../../types';
import { PERSONAS } from '../../lib/mascotData';

interface MascotSVGProps {
  personaId: MascotPersonaId;
  stage?: MascotStage;
  mascotState?: MascotState;
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function MascotSVG({
  personaId,
  stage = 'baby',
  mascotState = 'idle',
  size = 120,
  className = '',
  animate = true,
}: MascotSVGProps) {
  const persona = PERSONAS[personaId];

  // We can add some basic CSS animations based on state
  let stateAnimationClass = '';
  if (animate) {
    switch (mascotState) {
      case 'happy':
      case 'levelUp':
        stateAnimationClass = 'animate-bounce';
        break;
      case 'studying':
        stateAnimationClass = 'animate-pulse';
        break;
      case 'sad':
        stateAnimationClass = 'opacity-80 grayscale-[20%]';
        break;
      case 'streakReminder':
        stateAnimationClass = 'animate-shake';
        break;
      default:
        stateAnimationClass = 'animate-mascot-bounce';
        break;
    }
  }

  // Stage scaling
  let scaleStyle = 1;
  if (stage === 'baby') scaleStyle = 0.8;
  else if (stage === 'teen') scaleStyle = 0.9;
  
  return (
    <div 
      className={`relative flex items-center justify-center transition-all duration-300 ${stateAnimationClass} ${className}`}
      style={{ width: size, height: size, transform: `scale(${scaleStyle})`, mixBlendMode: 'multiply' }}
    >
      <img 
        src={persona.imagePath} 
        alt={persona.name} 
        className="w-full h-full object-contain" 
      />
    </div>
  );
}
