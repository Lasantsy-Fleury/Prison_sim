// Avatars creator (spec §3). Physical look is fully customizable and is kept
// independent of personality. Appearance is previewed live, then the inmate is
// added to the living simulation.

import { useEffect, useRef, useState } from 'react';
import { X, Check } from 'lucide-react';
import type { GameEngine } from './GameEngine';
import type { Appearance } from './world/types';
import { drawAvatarPreview } from './sprites/Avatar';
import { HAIR_STYLES, HATS, SKIN_TONES, HAIR_COLORS, CLOTHES_COLORS, PRESET_AVATARS } from './sprites/appearance';

interface Props {
  engine: GameEngine;
  onClose: () => void;
  onCreate?: (name: string, age: number) => void;
}

const defaultAppearance: Appearance = {
  skin: 3,
  hairStyle: 1,
  hairColor: 1,
  facialHair: 2,
  glasses: false,
  hat: 0,
  tattoo: true,
  scar: false,
  build: 1,
  height: 1,
  ageLook: 1,
  clothes: 0,
  accessory: 0,
};

export function AvatarCreator({ engine, onClose, onCreate }: Props) {
  const [name, setName] = useState('Nouveau détenu');
  const [age, setAge] = useState(28);
  const [ap, setAp] = useState<Appearance>(defaultAppearance);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // live animated preview
  useEffect(() => {
    let raf = 0;
    let phase = 0;
    const tick = () => {
      if (canvasRef.current) drawAvatarPreview(canvasRef.current, ap, phase, 1, 'idle');
      phase += 0.05;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ap]);

  const set = (patch: Partial<Appearance>) => setAp((p) => ({ ...p, ...patch }));

  const applyPreset = (i: number) => {
    const p = PRESET_AVATARS[i];
    setName(p.name);
    setAp(p.appearance);
  };

  const confirm = () => {
    engine.addInmate({ name, age, appearance: ap });
    onCreate?.(name, age);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="avatar-creator" onClick={(e) => e.stopPropagation()}>
        <div className="ac-head">
          <h2>Créateur d'avatar</h2>
          <button className="hud-close" onClick={onClose} title="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className="ac-body">
          <div className="ac-preview">
            <canvas ref={canvasRef} width={160} height={200} />
            <div className="ac-presets">
              {PRESET_AVATARS.map((p, i) => (
                <button key={p.name} className="ac-preset" onClick={() => applyPreset(i)} title={p.name}>
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="ac-controls">
            <label>
              Nom
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              Âge {age}
              <input type="range" min={18} max={80} value={age} onChange={(e) => setAge(+e.target.value)} />
            </label>

            <Field label="Peau" value={ap.skin} max={SKIN_TONES.length - 1} onChange={(v) => set({ skin: v })} />
            <Field label="Coupe" value={ap.hairStyle} max={HAIR_STYLES.length - 1} names={HAIR_STYLES as readonly string[]} onChange={(v) => set({ hairStyle: v })} />
            <Field label="Couleur cheveux" value={ap.hairColor} max={HAIR_COLORS.length - 1} onChange={(v) => set({ hairColor: v })} />
            <Field label="Pilosité" value={ap.facialHair} max={3} names={['Aucune', 'Moustache', 'Barbe', 'Barbe courte']} onChange={(v) => set({ facialHair: v })} />
            <Field label="Chapeau" value={ap.hat} max={HATS.length - 1} names={HATS as readonly string[]} onChange={(v) => set({ hat: v })} />
            <Field label="Corpulence" value={ap.build} max={3} names={['Mince', 'Normal', 'Musclé', 'Large']} onChange={(v) => set({ build: v })} />
            <Field label="Taille" value={ap.height} max={2} names={['Petit', 'Normal', 'Grand']} onChange={(v) => set({ height: v })} />
            <Field label="Âge apparent" value={ap.ageLook} max={3} names={['Jeune', 'Adulte', 'Mûr', 'Vieux']} onChange={(v) => set({ ageLook: v })} />
            <Field label="Vêtements" value={ap.clothes} max={CLOTHES_COLORS.length - 1} onChange={(v) => set({ clothes: v })} />
            <Field label="Accessoire" value={ap.accessory} max={4} names={['Aucun', 'Cigarette', 'Téléphone', 'Boucle', 'Collier']} onChange={(v) => set({ accessory: v })} />

            <div className="ac-toggles">
              <Toggle label="Lunettes" on={ap.glasses} onClick={() => set({ glasses: !ap.glasses })} />
              <Toggle label="Tatouage" on={ap.tattoo} onClick={() => set({ tattoo: !ap.tattoo })} />
              <Toggle label="Cicatrice" on={ap.scar} onClick={() => set({ scar: !ap.scar })} />
            </div>
          </div>
        </div>

        <div className="ac-foot">
          <button className="hud-btn" onClick={onClose}>Annuler</button>
          <button className="hud-btn primary" onClick={confirm}>
            <Check size={15} /> Créer le détenu
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, max, names, onChange }: { label: string; value: number; max: number; names?: readonly string[]; onChange: (v: number) => void }) {
  return (
    <label>
      {label} {names ? `: ${names[value]}` : ''}
      <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(+e.target.value)} />
    </label>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button className={`ac-toggle ${on ? 'on' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}
