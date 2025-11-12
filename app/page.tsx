'use client';

import { CanvasProvider } from './context/CanvasContext';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';

export default function Home() {
  return (
    <CanvasProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        <Toolbar />
        <div className="flex-1 relative">
          <Canvas />
        </div>
      </div>
    </CanvasProvider>
  );
}
