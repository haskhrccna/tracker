import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { GRADE_THRESHOLDS, getGrade } from '../utils/constants';

export function GradeDistributionChart({ records }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const data = GRADE_THRESHOLDS.map(g => {
    const count = records.filter(r => getGrade(r.score).label === g.label).length;
    const label = i18n.language === 'en' ? g.labelEn : i18n.language === 'fr' ? g.labelFr : g.label;
    return { name: label, count, color: g.color, emoji: g.emoji };
  }).filter(d => d.count > 0);

  if (data.length === 0) return null;

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
        margin: '0 0 20px',
        color: dark ? '#e0f2fe' : '#0f172a',
      }}>
        {t('student.gradeDistribution')}
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={3}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: dark ? '#334155' : '#fff',
              border: 'none',
              borderRadius: 10,
              color: dark ? '#e2e8f0' : '#1e293b',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreProgressChart({ records }) {
  const { dark } = useTheme();
  const { i18n } = useTranslation();

  if (records.length < 2) return null;

  const data = [...records]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-20)
    .map(r => ({
      name: r.surah.length > 6 ? r.surah.substring(0, 6) + '..' : r.surah,
      score: r.score,
      fill: getGrade(r.score).color,
    }));

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
        margin: '0 0 20px',
        color: dark ? '#e0f2fe' : '#0f172a',
      }}>
        {i18n.language === 'ar' ? 'تقدم الدرجات' : i18n.language === 'fr' ? 'Progression des Notes' : 'Score Progress'}
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#334155' : '#f1f5f9'} />
          <XAxis
            dataKey="name"
            tick={{ fill: dark ? '#94a3b8' : '#64748b', fontSize: 11 }}
            axisLine={{ stroke: dark ? '#475569' : '#e2e8f0' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: dark ? '#94a3b8' : '#64748b', fontSize: 11 }}
            axisLine={{ stroke: dark ? '#475569' : '#e2e8f0' }}
          />
          <Tooltip
            contentStyle={{
              background: dark ? '#334155' : '#fff',
              border: 'none',
              borderRadius: 10,
              color: dark ? '#e2e8f0' : '#1e293b',
            }}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
