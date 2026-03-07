import React from 'react';
import NZHeroStats from './NZHeroStats';
import EvolutionaryMismatch from './EvolutionaryMismatch';
import ExtinctionCross from './ExtinctionCross';
import PossumExplosionChart from './PossumExplosionChart';
import NZReclamationMap from './NZReclamationMap';
import PF2050Progress from './PF2050Progress';

export default function NewZealandTab() {
  return (
    <>
      <NZHeroStats />
      <EvolutionaryMismatch />
      <ExtinctionCross />
      <PossumExplosionChart />
      <NZReclamationMap />
      <PF2050Progress />
    </>
  );
}
