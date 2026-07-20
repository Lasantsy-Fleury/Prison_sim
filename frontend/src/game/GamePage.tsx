import { useState, useEffect, useMemo, useRef } from 'react';
import { Inmate } from '../api/types';
import { useGame } from './useGame';
import { useGameClock, GameSpeed } from './schedule';
import {
  useAdvanceDays,
  useBuildingCatalog,
  useEconomy,
  useCreateBuilding,
  useMoveBuilding,
} from '../hooks/usePrisonActions';
import { useToast } from '../components/Toast';
import { GameTopBar } from './GameTopBar';
import { BuildBar } from './BuildBar';
import { BuildingPanel } from './BuildingPanel';
import { EconomyPanel } from './EconomyPanel';
import { GameCanvas } from './engine/GameCanvas';
import type { BuildingLike } from './engine/world/types';
import type { InmateSeed, GameEngine } from './engine/GameEngine';

function satisfaction(inmates: Inmate[]): number {
  const active = inmates.filter((i) => i.status === 'ACTIVE');
  if (active.length === 0) return 50;
  const avg = active.reduce((s, i) => s + i.morale, 0) / active.length;
  return Math.round(avg);
}

export function GamePage() {
  const game = useGame();
  const advance = useAdvanceDays();
  const catalog = useBuildingCatalog();
  const economy = useEconomy();
  const createBuilding = useCreateBuilding();
  const moveBuilding = useMoveBuilding();
  const { notify } = useToast();

  const [speed, setSpeed] = useState<GameSpeed>('normal');
  const [selected, setSelected] = useState<BuildingLike | null>(null);
  const [buildType, setBuildType] = useState<string | null>(null);
  const [showEconomy, setShowEconomy] = useState(false);
  const engineRef = useRef<GameEngine | null>(null);

  const clock = useGameClock(speed, () => {
    if (!advance.isPending) advance.mutate(1);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBuildType(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const inmates = (game.inmates.data ?? []) as Inmate[];
  const inmateSeeds: InmateSeed[] = useMemo(
    () =>
      inmates
        .filter((i) => i.status === 'ACTIVE')
        .map((i) => ({
          id: i.id,
          name: i.name,
          age: i.age,
          block: i.block,
          status: i.status,
          intelligence: i.intelligence,
          fear: i.fear,
          aggressiveness: i.aggressiveness,
          morale: i.morale,
          behaviorScore: i.behaviorScore,
        })),
    [inmates],
  );

  if (game.isLoading) {
    return (
      <div className="loading-wrap">
        <span className="spinner" />
      </div>
    );
  }

  const buildings = (game.buildings.data ?? []) as BuildingLike[];
  const guards = game.guards.data ?? [];
  const dash = game.dashboard.data;
  const catalogList = catalog.data ?? [];

  const specFor = (type: string) => catalogList.find((c) => c.type === type);

  const handleSelectType = (type: string | null) => setBuildType(type);
  const handlePlace = (wx: number, wy: number) => {
    if (!buildType) return;
    const spec = specFor(buildType);
    if (!spec) return;
    const x = Math.max(0, Math.round(wx - spec.w / 2));
    const y = Math.max(0, Math.round(wy - spec.h / 2));
    createBuilding.mutate(
      { type: buildType, x, y },
      { onError: (err: any) => notify(err?.response?.data?.message ?? 'Construction impossible.', true) },
    );
  };
  const handleStartMove = (id: number) => setSelected(buildings.find((b) => b.id === id) ?? null);

  return (
    <div className="game-shell">
      <GameTopBar
        day={dash?.day ?? 1}
        hourLabel={clock.hourLabel}
        phase={clock.phase}
        budget={dash?.budget ?? 0}
        net={economy.data?.net ?? 0}
        population={dash?.population ?? 0}
        security={dash?.securityLevel ?? 0}
        satisfaction={satisfaction(inmates)}
        onOpenEconomy={() => setShowEconomy(true)}
      />
      <div className="game-body">
        <BuildBar catalog={catalogList} budget={dash?.budget ?? 0} selectedType={buildType} onSelectType={handleSelectType} />

        <GameCanvas
          buildings={buildings}
          inmates={inmateSeeds}
          guardsCount={guards.length}
          buildType={buildType}
          buildSpec={buildType ? (specFor(buildType) ?? null) : null}
          budget={dash?.budget ?? 0}
          securityLevel={dash?.securityLevel ?? 0}
          onPlace={handlePlace}
          onReady={(e) => (engineRef.current = e)}
          onAdvanceDay={() => advance.mutate(1)}
          onOpenEconomy={() => setShowEconomy(true)}
        />
      </div>

      {selected && (
        <BuildingPanel building={selected as any} onClose={() => setSelected(null)} onStartMove={handleStartMove} />
      )}
      {showEconomy && <EconomyPanel onClose={() => setShowEconomy(false)} />}
    </div>
  );
}
