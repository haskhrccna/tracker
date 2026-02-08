import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../hooks/useNotifications';
import { LANG_KEY } from '../utils/constants';
import { getStyles } from '../utils/styles';

export default function SettingsPanel({ onClose }) {
  const { dark, toggle } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);
  const { enabled, reminderTime, enableNotifications, disableNotifications, setReminderTime } = useNotifications();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleNotifToggle = async () => {
    if (enabled) {
      disableNotifications();
    } else {
      await enableNotifications(reminderTime);
    }
  };

  const handleTimeChange = (e) => {
    const time = e.target.value;
    setReminderTime(time);
    localStorage.setItem('quran-tracker-notif-time', time);
    if (enabled) {
      enableNotifications(time);
    }
  };

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={{ ...s.modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitle}>{t('common.settings')}</h3>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>
        <div style={s.modalBody}>
          {/* Dark Mode */}
          <div style={s.settingsRow}>
            <span style={s.settingsLabel}>
              {dark ? t('common.lightMode') : t('common.darkMode')}
            </span>
            <button onClick={toggle} style={s.toggle(dark)}>
              <div style={s.toggleDot(dark)} />
            </button>
          </div>

          {/* Language */}
          <div style={s.settingsRow}>
            <span style={s.settingsLabel}>{t('common.language')}</span>
            <select
              value={i18n.language}
              onChange={e => changeLanguage(e.target.value)}
              style={s.langSelect}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>

          {/* Notifications */}
          <div style={s.settingsRow}>
            <span style={s.settingsLabel}>{t('common.enableNotifications')}</span>
            <button onClick={handleNotifToggle} style={s.toggle(enabled)}>
              <div style={s.toggleDot(enabled)} />
            </button>
          </div>

          {enabled && (
            <div style={{ ...s.settingsRow, borderBottom: 'none' }}>
              <span style={s.settingsLabel}>{t('common.notificationTime')}</span>
              <input
                type="time"
                value={reminderTime}
                onChange={handleTimeChange}
                style={{
                  ...s.langSelect,
                  padding: '6px 10px',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
