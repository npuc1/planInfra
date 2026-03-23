import { useEffect, useState } from 'react';
import type { RailSegment } from '../data/railNetwork';

interface RailNetworkJSON {
  segments: RailSegment[];
}

// Fetches public/rail_network.json exactly once on mount.
// Returns an empty array until the fetch resolves.
export function useRailSegments(): RailSegment[] {
  const [segments, setSegments] = useState<RailSegment[]>([]);

  useEffect(() => {
    fetch('/rail_network.json')
      .then(r => r.json() as Promise<RailNetworkJSON>)
      .then(data => setSegments(data.segments));
  }, []);

  return segments;
}
