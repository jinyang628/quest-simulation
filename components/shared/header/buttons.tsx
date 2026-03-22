'use client';

import { ThemeToggle } from '@/components/shared/theme/toggle';

export default function HeaderButtons() {
  return (
    <div className="px flex w-full items-center justify-end">
      <ThemeToggle />
    </div>
  );
}
