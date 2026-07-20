import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/');
    } catch (err: any) {
      notify(err?.response?.data?.message ?? 'Échec de l’inscription', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-box">
      <div className="card auth-card">
        <h1>Créer un compte</h1>
        <p className="page-sub">Devenez directeur de votre propre prison virtuelle.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Nom (optionnel)</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Directeur"
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="directeur@prison.fr"
            />
          </div>
          <div className="field">
            <label>Mot de passe (6+ caractères)</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Création…' : 'Créer le compte'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
