import React from 'react';
import NZHeroStats from './NZHeroStats';
import EvolutionaryMismatch from './EvolutionaryMismatch';
import PossumExplosionChart from './PossumExplosionChart';
import PF2050Progress from './PF2050Progress';

export default function NewZealandTab() {
  return (
    <>
      <NZHeroStats />
      <EvolutionaryMismatch />
      <PossumExplosionChart />
      <PF2050Progress />
    </>
  );
}
