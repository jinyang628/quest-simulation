import Simulation from '@/components/simulation';

export default function Home() {
  return (
    <div className="bg-background flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <header className="space-y-1">
          <h1 className="font-heading text-center text-2xl font-semibold tracking-tight">
            Quest simulation
          </h1>
        </header>
        <Simulation />
      </div>
    </div>
  );
}
