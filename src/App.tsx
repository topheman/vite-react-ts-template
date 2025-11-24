import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex items-center justify-center min-w-[320px] bg-[#242424] text-[rgba(255,255,255,0.87)]">
      <div className="max-w-[1280px] mx-auto px-8 text-center">
        <div className="flex justify-center gap-8 mb-8">
          <a href="https://vite.dev" target="_blank">
            <img
              src={viteLogo}
              className="h-24 p-6 transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_#646cffaa]"
              alt="Vite logo"
            />
          </a>
          <a href="https://react.dev" target="_blank">
            <img
              src={reactLogo}
              className="h-24 p-6 transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa] animate-spin [animation-duration:20s]"
              alt="React logo"
            />
          </a>
        </div>
        <h1 className="text-5xl leading-tight mb-8">Vite + React</h1>
        <div className="p-8">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="rounded-lg border border-transparent px-5 py-2.5 text-base font-medium font-sans bg-[#1a1a1a] cursor-pointer transition-[border-color] duration-[0.25s] hover:border-[#646cff] focus-visible:outline-4 focus-visible:outline-offset-2"
          >
            count is {count}
          </button>
          <p className="mt-4">
            Edit <code className="font-mono">src/App.tsx</code> and save to test
            HMR
          </p>
        </div>
        <p className="text-[#888]">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  );
}

export default App;
