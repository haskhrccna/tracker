import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getStyles } from '../utils/styles';
import { supabase } from '../lib/supabase';

/**
 * ForcePasswordResetPage
 *
 * Shown when the authenticated user's profile has must_reset_password=true.
 * After they set a new password, the post-update trigger in the database
 * clears the flag, and App.jsx re-fetches the profile to resume the normal
 * dashboard.
 */
export default function ForcePasswordResetPage({ user, onComplete, onCancel }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (pw.length < 6) {
      setError(t('forceReset.pwTooShort', 'Must be at least 6 characters'));
      return;
    }
    if (pw !== pw2) {
      setError(t('forceReset.pwMismatch', 'Passwords do not match'));
      return;
    }

    setBusy(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password: pw });
      if (updateErr) throw updateErr;

      // Fallback: if the DB trigger didn't clear the flag (e.g. local dev without trigger),
      // clear it explicitly.
      await supabase.from('profiles').update({ must_reset_password: false }).eq('id', user.id);

      onComplete();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.authBg}>
      <div style={s.authPattern}></div>

      <div style={{ ...s.authCard, maxWidth: 440 }}>
        <div style={s.authHeader}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #C8A85A, #8A6A1F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', boxShadow: '0 8px 20px rgba(200,168,90,0.4)',
          }}>
            <span style={{ fontSize: 28 }}>🔑</span>
          </div>
          <h1 style={s.authTitle}>
            {t('forceReset.title', 'Create a new password')}
          </h1>
          <p style={s.authSubtitle}>
            {t('forceReset.subtitle', 'An administrator has reset your password. Please choose a new one to continue.')}
          </p>
        </div>

        {/* Who's resetting */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', background: dark ? '#1e293b' : '#f1f5f9',
          borderRadius: 10, margin: '0 0 16px',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2E5339, #1F3B28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14,
          }}>
            {(user.full_name || user.fullName || user.username || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: dark ? '#f1f5f9' : '#1e293b' }}>
              {user.full_name || user.fullName}
            </div>
            <div style={{ fontSize: 11, color: dark ? '#94a3b8' : '#64748b' }}>
              {user.email || user.username}
            </div>
          </div>
        </div>

        <div style={s.authForm}>
          <div style={s.fieldGroup}>
            <label style={s.label}>{t('forceReset.newPassword', 'New password')}</label>
            <div style={{ position: 'relative' }}>
              <input
                style={s.input}
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
              />
              <button onClick={() => setShow(!show)} style={s.eyeBtn}>
                {show ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>{t('forceReset.confirmPassword', 'Confirm password')}</label>
            <input
              style={s.input}
              type={show ? 'text' : 'password'}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {error && <div style={s.error}>{error}</div>}

          <button onClick={submit} style={s.primaryBtn} disabled={busy}>
            {busy ? '...' : t('forceReset.continue', 'Continue')}
          </button>

          <button
            onClick={onCancel}
            style={{ ...s.logoutBtn, margin: '12px 0 0', width: '100%', background: 'transparent' }}
          >
            {t('forceReset.cancel', 'Cancel — sign out')}
          </button>
        </div>
      </div>
    </div>
  );
}
