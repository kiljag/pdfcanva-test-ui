'use client';

import StoreProvider from './store/StoreProvider';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';

export default function Home() {
  return (
    <StoreProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        <Toolbar />
        <div className="flex-1 relative">
          <Canvas />
        </div>
      </div>
    </StoreProvider>
  );
}
