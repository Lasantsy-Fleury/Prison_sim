import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { qk } from '../api/queryKeys';
import { Inmate } from '../api/types';
import { InmateCard } from '../components/InmateCard';
import { Modal } from '../components/ui/Modal';
import { useCreateInmate, useSeedInmates } from '../hooks/usePrisonActions';
import { useToast } from '../components/Toast';

const BLOCKS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2'];

export function InmatesPage() {
  const { notify } = useToast();
  const create = useCreateInmate();
  const seed = useSeedInmates();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    age: 30,
    intelligence: 50,
    fear: 50,
    aggressiveness: 50,
    morale: 50,
    block: 'A1',
  });

  const { data, isLoading } = useQuery<Inmate[]>({
    queryKey: qk.inmates,
    queryFn: async () => (await api.get('/inmates?status=ALL')).data,
  });

  const active = (data ?? []).filter((i) => i.status === 'ACTIVE');
  const inactive = (data ?? []).filter((i) => i.status !== 'ACTIVE');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      notify('Le nom est obligatoire', true);
      return;
    }
    await create.mutateAsync(form);
    notify(`${form.name} a été incarcéré.`);
    setShowModal(false);
    setForm({ ...form, name: '' });
  };

  return (
    <div>
      <div className="toolbar between">
        <div>
          <h1>Détenus</h1>
          <p className="page-sub">
            {active.length} actifs · {inactive.length} sortis/évadés
          </p>
        </div>
        <div className="btn-row">
          <button
            className="btn"
            disabled={seed.isPending}
            onClick={async () => {
              await seed.mutateAsync(5);
              notify('5 détenus générés.');
            }}
          >
            <Users />
            {seed.isPending ? 'Génération…' : 'Générer 5'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus />
            Nouveau détenu
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-wrap">
          <span className="spinner" />
        </div>
      ) : active.length === 0 ? (
        <div className="empty">
          Aucun détenu actif. Générez une population ou ajoutez un détenu manuellement.
        </div>
      ) : (
        <div className="grid grid-3">
          {active.map((i) => (
            <InmateCard key={i.id} inmate={i} />
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2>Anciens détenus (sortis / évadés)</h2>
          <div className="grid grid-3">
            {inactive.map((i) => (
              <InmateCard key={i.id} inmate={i} />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <Modal title="Nouveau détenu" onClose={() => setShowModal(false)}>
          <form onSubmit={submit}>
            <div className="field">
              <label>Nom complet</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Karim BENALI"
                required
              />
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label>Âge</label>
                <input
                  className="input"
                  type="number"
                  min={16}
                  max={95}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label>Bloc</label>
                <select
                  className="select"
                  value={form.block}
                  onChange={(e) => setForm({ ...form, block: e.target.value })}
                >
                  {BLOCKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {(
              [
                ['intelligence', 'Intelligence'],
                ['fear', 'Peur'],
                ['aggressiveness', 'Agressivité'],
                ['morale', 'Moral'],
              ] as const
            ).map(([key, label]) => (
              <div className="field" key={key}>
                <label>
                  {label} : {form[key]}
                </label>
                <input
                  className="range"
                  type="range"
                  min={0}
                  max={100}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                />
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={create.isPending}>
              {create.isPending ? 'Incarceration…' : 'Incarcer'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
