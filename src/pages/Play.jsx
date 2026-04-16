import React, { lazy, Suspense } from 'react';
import GameFrame from '../components/GameFrame';
import LoadingScreen from '../components/LoadingScreen';

// The main RPG game — loads dynamically from the games directory
const BettaWarlords = lazy(() => import('../games/BettaWarlords'));

export default function Play() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <BettaWarlords />
    </Suspense>
  );
}
