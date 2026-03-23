import { ApiTester } from "../componenets/tester";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-stretch justify-center px-4 py-6 overflow-hidden">
      <main className="w-full  bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Khushi API Client
            </h1>
            <p className="text-xs text-zinc-400">
              API Tester
            </p>
          </div>
        </header>
        <ApiTester />
      </main>
    </div>
  );
}


