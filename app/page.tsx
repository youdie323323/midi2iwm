import { useEffect } from 'react';

declare const Go: any; // Goランタイムを宣言

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