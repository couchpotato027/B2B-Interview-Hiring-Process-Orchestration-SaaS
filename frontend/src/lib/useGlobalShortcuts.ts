import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GLOBAL_SHORTCUTS } from './shortcuts';

export function useGlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      const currentTime = Date.now();
      const combo = lastKey && (currentTime - lastKeyTime < 500) ? `${lastKey} ${e.key}` : e.key;
      
      const match = GLOBAL_SHORTCUTS.find(s => s.key === combo || s.key === e.key);

      if (match) {
        if (match.command.startsWith('/')) {
            e.preventDefault();
            router.push(match.command);
            lastKey = '';
            return;
        }

        if (match.command === 'focus-search') {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
        }
      }

      lastKey = e.key;
      lastKeyTime = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
