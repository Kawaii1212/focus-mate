import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MascotPanel from './MascotPanel';
import { MascotState } from '../../types';
import { ScrollArea } from '../ui/scroll-area';

interface AppLayoutProps {
  children: React.ReactNode;
  hideMascotPanel?: boolean;
  mascotState?: MascotState;
}

export default function AppLayout({ children, hideMascotPanel = false, mascotState }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Content + Mascot Panel */}
        <div className="flex flex-1 min-h-0">
          {/* Main content */}
          <ScrollArea className="flex-1">
            <main className="p-6 min-h-full">
              {children}
            </main>
          </ScrollArea>

          {/* Right: Mascot Panel */}
          {!hideMascotPanel && (
            <MascotPanel forcedState={mascotState} />
          )}
        </div>
      </div>
    </div>
  );
}
