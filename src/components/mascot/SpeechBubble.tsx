import React from 'react';

interface SpeechBubbleProps {
  text: string;
  className?: string;
  direction?: 'left' | 'right' | 'top';
}

export default function SpeechBubble({ text, className = '', direction = 'left' }: SpeechBubbleProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="bg-card border border-border rounded-2xl px-4 py-2.5 shadow-fm-sm max-w-[200px]">
        <p className="text-sm text-foreground leading-relaxed">{text}</p>
      </div>
      {/* Tail */}
      {direction === 'left' && (
        <div
          className="absolute -left-2 top-4 w-0 h-0"
          style={{
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: '10px solid hsl(var(--card))',
            filter: 'drop-shadow(-2px 0 1px hsl(var(--border)))',
          }}
        />
      )}
      {direction === 'right' && (
        <div
          className="absolute -right-2 top-4 w-0 h-0"
          style={{
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderLeft: '10px solid hsl(var(--card))',
          }}
        />
      )}
    </div>
  );
}
