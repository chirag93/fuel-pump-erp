
import { useState, useEffect } from 'react';

// Simple hook to check if screen size matches a specific query
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);

  return matches;
}

// Hook to check if the current device is mobile
export const useMobile = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile;
};

// Aliasing useMobile as useIsMobile for backward compatibility
export const useIsMobile = useMobile;

export default useMobile;
