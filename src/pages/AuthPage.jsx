import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getStyles } from '../utils/styles';
import { supabase } from '../lib/supabase';

export default function AuthPage({ login, register }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);

  const [mode, setMode] = useState('login'); // login | register | forgot | reset
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Detect password reset callback in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setMode('reset');
    }
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (mode === 'forgot') {
      if (!email.trim()) { setError(t('auth.enterEmailForReset')); return; }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        alert(t('auth.resetPasswordSent'));
        setMode('login');
      }
      return;
    }

    if (mode === 'reset') {
      if (password.length < 8) { setError(t('auth.passwordMinLength')); return; }
      if (password !== confirmPassword) { setError(t('auth.passwordsDoNotMatch')); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
      } else {
        alert(t('auth.passwordResetSuccess'));
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        window.location.hash = '';
      }
      return;
    }

    if (!username.trim() || !password.trim()) { setError(t('auth.fillAllFields')); return; }
    if (mode === 'login') {
      const success = await login(username, password);
      if (!success) setError(t('auth.invalidCredentials'));
    } else {
      if (!fullName.trim()) { setError(t('auth.enterFullNameError')); return; }
      if (password.length < 8) { setError(t('auth.passwordMinLength')); return; }
      if (!email.trim()) { setError(t('auth.emailRequired')); return; }
      const success = await register({ username, email: email.trim(), password, role: 'student', fullName, language: i18n.language });
      if (!success) setError(t('auth.usernameTaken'));
    }
  };

  const showTabs = mode === 'login' || mode === 'register';

  return (
    <div style={s.authBg}>
      <div style={s.authPattern}></div>

      {/* Language switcher on auth page */}
      <div style={{ position: 'absolute', top: 16, right: isRTL ? 'auto' : 16, left: isRTL ? 16 : 'auto', zIndex: 10 }}>
        <select
          value={i18n.language}
          onChange={e => {
            i18n.changeLanguage(e.target.value);
            localStorage.setItem('quran-tracker-lang', e.target.value);
            document.documentElement.lang = e.target.value;
            document.documentElement.dir = e.target.value === 'ar' ? 'rtl' : 'ltr';
          }}
          style={{
            padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13,
            fontFamily: "'Tajawal'", cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="ar" style={{ color: '#000' }}>العربية</option>
          <option value="en" style={{ color: '#000' }}>English</option>
          <option value="fr" style={{ color: '#000' }}>Français</option>
        </select>
      </div>

      <div style={s.authCard}>
        <div style={s.authHeader}>
          <div style={s.authIcon}>📖</div>
          <h1 style={s.authTitle}>{t('app.title')}</h1>
          <p style={s.authSubtitle}>{t('app.subtitle')}</p>
        </div>

        {showTabs && (
          <div style={s.tabRow}>
            <button onClick={() => { setMode('login'); setError(''); }} style={{ ...s.tab, ...(mode === 'login' ? s.tabActive : {}) }}>
              {t('auth.login')}
            </button>
            <button onClick={() => { setMode('register'); setError(''); }} style={{ ...s.tab, ...(mode === 'register' ? s.tabActive : {}) }}>
              {t('auth.register')}
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <h2 style={{ ...s.authTitle, fontSize: 20, marginBottom: 16 }}>{t('auth.resetPassword')}</h2>
        )}
        {mode === 'reset' && (
          <h2 style={{ ...s.authTitle, fontSize: 20, marginBottom: 16 }}>{t('auth.newPassword')}</h2>
        )}

        <div style={s.authForm}>
          {mode === 'register' && (
            <div style={s.fieldGroup}>
              <label style={s.label}>{t('auth.fullName')}</label>
              <input style={s.input} placeholder={t('auth.enterFullName')} value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div style={s.fieldGroup}>
              <label style={s.label}>{t('auth.username')}</label>
              <input style={s.input} placeholder={t('auth.enterUsername')} value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          )}

          {(mode === 'register' || mode === 'forgot') && (
            <div style={s.fieldGroup}>
              <label style={s.label}>{t('auth.email')}</label>
              <input style={s.input} placeholder={t('auth.enterEmail')} value={email} onChange={e => setEmail(e.target.value)} type="email" />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div style={s.fieldGroup}>
              <label style={s.label}>{t('auth.password')}</label>
              <div style={{ position: 'relative' }}>
                <input style={s.input} type={showPassword ? 'text' : 'password'} placeholder={t('auth.enterPassword')} value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                <button onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div style={s.fieldGroup}>
              <label style={s.label}>{t('auth.confirmNewPassword')}</label>
              <div style={{ position: 'relative' }}>
                <input style={s.input} type={showPassword ? 'text' : 'password'} placeholder={t('auth.confirmNewPassword')} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            </div>
          )}

          {error && <div style={s.error}>{error}</div>}
          <button onClick={handleSubmit} style={s.primaryBtn}>
            {mode === 'login' ? t('auth.submit') : mode === 'register' ? t('auth.createAccount') : mode === 'forgot' ? t('auth.resetPassword') : t('auth.newPassword')}
          </button>

          {mode === 'login' && (
            <button onClick={() => { setMode('forgot'); setError(''); }} style={{ ...s.secondaryBtn, marginTop: 8, width: '100%', background: 'transparent', border: 'none', color: dark ? '#94a3b8' : '#64748b', cursor: 'pointer', fontSize: 13 }}>
              {t('auth.forgotPassword')}
            </button>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <button onClick={() => { setMode('login'); setError(''); setPassword(''); setConfirmPassword(''); window.location.hash = ''; }} style={{ ...s.secondaryBtn, marginTop: 8, width: '100%', background: 'transparent', border: 'none', color: dark ? '#94a3b8' : '#64748b', cursor: 'pointer', fontSize: 13 }}>
              {t('auth.login')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
