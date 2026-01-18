import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export const AuthPage = () => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user && fullName) {
          await supabase.from('profiles').insert({ id: data.user.id, full_name: fullName });
        }
      }
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Saude Comunitaria</h1>
        <p>Entre para mapear e gerenciar riscos em saude.</p>
        <form onSubmit={handleAuth} className="form">
          {mode === 'signup' && (
            <label>
              Nome completo
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {status && <div className="alert">{status}</div>}
          <button className="button primary" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
        <button
          className="button ghost"
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? 'Precisa de conta? Cadastre-se' : 'Ja tem conta? Entrar'}
        </button>
      </div>
    </div>
  );
};
