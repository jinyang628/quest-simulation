import Simulation from '@/components/simulation';

export default function Home() {
  return (
    <div className="bg-background flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Quest simulation</h1>
          <p className="text-muted-foreground text-sm">
            Configure roles, then run missions: each round a leader is picked at random (no repeat
            until everyone has led once). Good roles always play success; evil players may play
            success or fail.
          </p>
        </header>
        <Simulation />
      </div>
    </div>
  );
}
