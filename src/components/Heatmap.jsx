import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function Heatmap({ activityMap }) {
  const { dark } = useTheme();
  const { t } = useTranslation();

  // Generate last 6 months of dates
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 6);

  const days = [];
  const d = new Date(startDate);
  while (d <= today) {
    days.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }

  // Group by week
  const weeks = [];
  let currentWeek = [];
  const firstDay = new Date(days[0]).getDay();

  // Pad first week
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColor = (count) => {
    if (!count) return dark ? '#1e293b' : '#ebedf0';
    if (count === 1) return '#9be9a8';
    if (count <= 3) return '#40c463';
    if (count <= 5) return '#30a14e';
    return '#216e39';
  };

  const maxCount = Math.max(1, ...Object.values(activityMap || {}));

  return (
    <div style={{
      background: dark ? '#1e293b' : '#fff',
      borderRadius: 20,
      padding: '24px 28px',
      marginBottom: 20,
      boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <h3 style={{
        fontFamily: "'Amiri', serif",
        fontSize: 18,
        margin: '0 0 16px',
        color: dark ? '#e0f2fe' : '#0f172a',
      }}>
        {t('common.heatmap')}
      </h3>

      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 3, minWidth: 'fit-content' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day ? `${day}: ${activityMap?.[day] || 0} recitations` : ''}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: day ? getColor(activityMap?.[day] || 0) : 'transparent',
                    cursor: day ? 'pointer' : 'default',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', marginLeft: 4 }}>Less</span>
        {[0, 1, 2, 4, 6].map(n => (
          <div key={n} style={{ width: 14, height: 14, borderRadius: 3, background: getColor(n) }} />
        ))}
        <span style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', marginRight: 4 }}>More</span>
      </div>
    </div>
  );
}
