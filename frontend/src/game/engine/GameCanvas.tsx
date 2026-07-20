// React wrapper around the game engine: owns the canvas, mounts the engine, and
// renders the HUD / radial menu / avatar creator overlays.

import { useEffect, useRef, useState } from 'react';
import { GameEngine, type InmateSeed } from './GameEngine';
import type { BuildingLike } from './world/types';
import { GameHUD } from './GameHUD';
import { RadialMenu } from './RadialMenu';
import { AvatarCreator } from './AvatarCreator';

interface Props {
  buildings: BuildingLike[];
  inmates: InmateSeed[];
  guardsCount: number;
  buildType: string | null;
  buildSpec: { type: string; w: number; h: number } | null;
  budget: number;
  securityLevel: number;
  onPlace: (wx: number, wy: number) => void;
  onReady: (engine: GameEngine) => void;
  onAdvanceDay: () => void;
  onOpenEconomy: () => void;
  onCreateInmate?: (name: string, age: number) => void;
}

export function GameCanvas(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [radial, setRadial] = useState<{ targetId: number; x: number; y: number } | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const initRef = useRef(false);

  // mount engine once
  useEffect(() => {
    const eng = new GameEngine();
    eng.backgroundClickHandler = (wx, wy) => props.onPlace(wx, wy);
    eng.mount(canvasRef.current!);
    eng.start();
    const off = eng.bus.on('ui:radial', ({ entity, x, y }) => setRadial({ targetId: entity.id, x, y }));
    const ro = new ResizeObserver(() => eng.resize());
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);
    setEngine(eng);
    props.onReady(eng);
    return () => {
      off();
      ro.disconnect();
      eng.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // feed world data + spawn population once
  useEffect(() => {
    if (!engine || !props.buildings || !props.inmates) return;
    engine.setBuildings(props.buildings);
    if (!initRef.current) {
      engine.spawnInmates(props.inmates);
      engine.spawnGuards(props.guardsCount || 8);
      initRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, props.buildings, props.inmates, props.guardsCount]);

  // build ghost
  useEffect(() => {
    if (!engine) return;
    if (props.buildType && props.buildSpec) {
      engine.setGhost({ type: props.buildType, w: props.buildSpec.w, h: props.buildSpec.h });
    } else {
      engine.clearGhost();
    }
  }, [engine, props.buildType, props.buildSpec]);

  // external stats
  useEffect(() => {
    engine?.setExternalStats(props.budget, props.securityLevel);
  }, [engine, props.budget, props.securityLevel]);

  return (
    <div className="game-canvas-wrap">
      <canvas ref={canvasRef} className="game-canvas" />
      <div className="map-frame" aria-hidden="true">
        <span className="frame-corner tl" />
        <span className="frame-corner tr" />
        <span className="frame-corner bl" />
        <span className="frame-corner br" />
      </div>
      {engine && (
        <>
          <GameHUD
            engine={engine}
            onAdvanceDay={props.onAdvanceDay}
            onOpenEconomy={props.onOpenEconomy}
            onOpenAvatar={() => setAvatarOpen(true)}
          />
          {radial && (
            <RadialMenu
              engine={engine}
              targetId={radial.targetId}
              x={radial.x}
              y={radial.y}
              onClose={() => setRadial(null)}
            />
          )}
          {avatarOpen && (
            <AvatarCreator engine={engine} onClose={() => setAvatarOpen(false)} onCreate={props.onCreateInmate} />
          )}
        </>
      )}
    </div>
  );
}
