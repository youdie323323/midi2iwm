'use client';
import { useEffect } from 'react';

declare const Go: any;

export default function App() {
  useEffect(() => {
    (async () => {
      const go = new Go();
      const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject);
      go.run(result.instance);
    })();
  }, []);

  return <main>
    
  </main>
}