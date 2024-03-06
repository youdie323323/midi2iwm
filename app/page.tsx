export default function App() {
  const go = new Go();
  WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject).then((res) => go.run(res.instance));
  
  return <main></main>
}