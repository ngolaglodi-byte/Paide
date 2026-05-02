import { useState, useMemo } from 'react';

interface Props {
  onPasswordChanged: () => void;
}

export default function ForceChangePassword({ onPasswordChanged }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);

  const rules = useMemo(() => [
    { label: 'Au moins 8 caractères', valid: newPassword.length >= 8 },
    { label: 'Au moins une lettre majuscule (A-Z)', valid: /[A-Z]/.test(newPassword) },
    { label: 'Au moins un chiffre (0-9)', valid: /[0-9]/.test(newPassword) },
    { label: 'Au moins un caractère spécial (@#$!...)', valid: /[^a-zA-Z0-9]/.test(newPassword) },
  ], [newPassword]);

  const allValid = rules.every(r => r.valid);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!allValid) { setError('Le mot de passe ne respecte pas toutes les règles'); return; }
    if (!passwordsMatch) { setError('Les mots de passe ne correspondent pas'); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (response.ok) {
        alert("Mot de passe modifié avec succès");
        onPasswordChanged();
      } else {
        const err = await response.json();
        setError(err.message || 'Erreur');
      }
    } catch { setError('Erreur de connexion'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '450px', width: '100%', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', background: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>🔒</div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>Changement de mot de passe obligatoire</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>C'est votre première connexion. Veuillez créer un mot de passe sécurisé.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Mot de passe actuel (fourni par le secrétaire)</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="Ex: PAIDE-XXXXXX"
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Créez un mot de passe sécurisé"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', paddingRight: '60px' }} />
              <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>
                {showNew ? 'Cacher' : 'Voir'}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div style={{ marginTop: '8px', padding: '10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>Exigences :</div>
                {rules.map((rule, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: rule.valid ? '#059669' : '#6b7280', marginBottom: '2px' }}>
                    <span>{rule.valid ? '✓' : '○'}</span>
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>Confirmer le nouveau mot de passe</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Retapez le nouveau mot de passe"
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>✗ Les mots de passe ne correspondent pas</p>
            )}
            {passwordsMatch && (
              <p style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>✓ Les mots de passe correspondent</p>
            )}
          </div>
          
          {error && <div style={{ padding: '10px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
          
          <button type="submit" disabled={loading || !allValid || !passwordsMatch}
            style={{ width: '100%', padding: '12px', background: (loading || !allValid || !passwordsMatch) ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: (loading || !allValid || !passwordsMatch) ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
