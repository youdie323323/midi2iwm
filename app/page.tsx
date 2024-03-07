'use client'

import { useEffect } from 'react';

declare const Go: any;

export default function App() {
  useEffect(() => {
    const runWasm = async () => {
      const go = new Go();
      const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject);
      go.run(result.instance);
    };
    runWasm();
  }, []);

  return <main></main>
}