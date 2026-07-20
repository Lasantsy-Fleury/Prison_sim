// Radial context menu shown on right-click of an entity (spec §14).

import { useEffect } from 'react';
import { Crosshair, Maximize, ClipboardList, Scan, X } from 'lucide-react';
import type { GameEngine } from './GameEngine';

interface Props {
  engine: GameEngine;
  targetId: number;
  x: number; // client coords
  y: number;
  onClose: () => void;
}

export function RadialMenu({ engine, targetId, x, y, onClose }: Props) {
  const target = engine.world.get(targetId);
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener('click', close);
    window.addEventListener('pointerdown', close, { once: true });
    return () => {
      window.removeEventListener('click', close);
    };
  }, [onClose]);

  if (!target) return null;
  engine.selection.select(target);

  const actions = [
    { label: 'Suivre', icon: Crosshair, fn: () => engine.camera.followEntity(target) },
    { label: 'Centrer', icon: Maximize, fn: () => engine.camera.centerOn(target.x, target.y) },
    { label: 'Profil', icon: ClipboardList, fn: () => engine.selection.select(target) },
    { label: 'Vue', icon: Scan, fn: () => engine.resetView() },
  ];
  const R = 64;

  return (
    <div className="radial" style={{ left: x, top: y }}>
      <button className="radial-center" onClick={(e) => { e.stopPropagation(); onClose(); }} title="Fermer">
        <X size={16} />
      </button>
      {actions.map((a, i) => {
        const ang = (-Math.PI / 2) + (i / actions.length) * Math.PI * 2;
        const bx = Math.cos(ang) * R;
        const by = Math.sin(ang) * R;
        const Icon = a.icon;
        return (
          <button
            key={a.label}
            className="radial-item"
            style={{ transform: `translate(${bx}px, ${by}px)` }}
            onClick={(e) => {
              e.stopPropagation();
              a.fn();
              onClose();
            }}
          >
            <span className="radial-ic">
              <Icon size={18} />
            </span>
            <span className="radial-lbl">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}
