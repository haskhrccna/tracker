import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getStyles } from '../utils/styles';

export default function AuthPage({ login, register, backendEnabled }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!username.trim() || !password.trim()) { setError(t('auth.fillAllFields')); return; }
    if (mode === 'login') {
      const success = await login(username, password);
      if (!success) setError(t('auth.invalidCredentials'));
    } else {
      if (!fullName.trim()) { setError(t('auth.enterFullNameError')); return; }
      if (password.length < 4) { setError(t('auth.passwordMinLength')); return; }
      if (backendEnabled && !email.trim()) { setError(t('auth.emailRequired')); return; }
      const success = await register({ username, email: email.trim() || null, password, role, fullName, language: i18n.language });
      if (!success) setError(t('auth.usernameTaken'));
    }
  };

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

        <div style={s.tabRow}>
          <button onClick={() => { setMode("login"); setError(""); }} style={{ ...s.tab, ...(mode === "login" ? s.tabActive : {}) }}>
            {t('auth.login')}
          </button>
          <button onClick={() => { setMode("register"); setError(""); }} style={{ ...s.tab, ...(mode === "register" ? s.tabActive : {}) }}>
            {t('auth.register')}
          </button>
        </div>

        <div style={s.authForm}>
          {mode === "register" && (
            <div style={s.fieldGroup}>
              <label style={s.label}>{t('auth.fullName')}</label>
              <input style={s.input} placeholder={t('auth.enterFullName')} value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
          )}
          <div style={s.fieldGroup}>
            <label style={s.label}>{t('auth.username')}</label>
            <input style={s.input} placeholder={t('auth.enterUsername')} value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          {mode === 'register' && (
            <div style={s.fieldGroup}>
              <label style={s.label}>{t('auth.email')}</label>
              <input style={s.input} placeholder={t('auth.enterEmail')} value={email} onChange={e => setEmail(e.target.value)} type="email" />
            </div>
          )}
          <div style={s.fieldGroup}>
            <label style={s.label}>{t('auth.password')}</label>
            <div style={{ position: 'relative' }}>
              <input style={s.input} type={showPassword ? 'text' : 'password'} placeholder={t('auth.enterPassword')} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              <button onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>{showPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>
          {mode === 'register' && (
            <div style={s.fieldGroup}>
              <label style={s.label}>{t('auth.accountType')}</label>
              <div style={s.roleRow}>
                <button onClick={() => setRole('student')} style={{ ...s.roleBtn, ...(role === 'student' ? s.roleBtnActive : {}) }}>
                  🎓 {t('auth.student')}
                </button>
                <button onClick={() => setRole('teacher')} style={{ ...s.roleBtn, ...(role === 'teacher' ? s.roleBtnActive : {}) }}>
                  👨‍🏫 {t('auth.teacher')}
                </button>
              </div>
            </div>
          )}
          {error && <div style={s.error}>{error}</div>}
          <button onClick={handleSubmit} style={s.primaryBtn}>
            {mode === "login" ? t('auth.submit') : t('auth.createAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
