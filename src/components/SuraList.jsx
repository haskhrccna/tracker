import { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SURAHS, getGrade, SURAH_NUMBERS } from '../utils/constants';
import { getStyles } from '../utils/styles';

export default function SuraList({ records }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);

  const [filter, setFilter] = useState('all'); // all, completed, in-progress, not-started
  const [searchTerm, setSearchTerm] = useState('');

  // Create a map of surah name to record data
  const surahMap = useMemo(() => {
    const map = {};
    records.forEach(record => {
      if (!map[record.surah] || new Date(record.date) > new Date(map[record.surah].date)) {
        map[record.surah] = record;
      }
    });
    return map;
  }, [records]);

  // Create full surah list with status
  const surahList = useMemo(() => {
    return SURAHS.map((surah, index) => {
      const record = surahMap[surah];
      const surahNumber = index + 1;

      let status = 'not-started';
      if (record) {
        status = record.completed ? 'completed' : 'in-progress';
      }

      return {
        number: surahNumber,
        name: surah,
        status,
        record,
      };
    });
  }, [surahMap]);

  // Filter and search
  const filteredSurahs = useMemo(() => {
    return surahList.filter(surah => {
      // Filter by status
      if (filter !== 'all' && surah.status !== filter) return false;

      // Filter by search term
      if (searchTerm && !surah.name.includes(searchTerm) && !surah.number.toString().includes(searchTerm)) {
        return false;
      }

      return true;
    });
  }, [surahList, filter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const completed = surahList.filter(s => s.status === 'completed').length;
    const inProgress = surahList.filter(s => s.status === 'in-progress').length;
    const notStarted = surahList.filter(s => s.status === 'not-started').length;
    const totalScore = records.reduce((sum, r) => sum + r.score, 0);
    const avgScore = records.length > 0 ? Math.round(totalScore / records.length) : 0;

    return { completed, inProgress, notStarted, avgScore, total: 114 };
  }, [surahList, records]);

  const styles = {
    container: {
      maxWidth: 1000,
      margin: '0 auto',
      padding: '20px',
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 700,
      color: dark ? '#f1f5f9' : '#1e293b',
      marginBottom: 16,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      background: dark ? '#1e293b' : '#fff',
      border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 12,
      padding: 16,
      textAlign: 'center',
    },
    statNum: {
      fontSize: 28,
      fontWeight: 700,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: dark ? '#94a3b8' : '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    controls: {
      display: 'flex',
      gap: 12,
      marginBottom: 20,
      flexWrap: 'wrap',
    },
    searchBox: {
      flex: '1 1 200px',
      padding: '10px 16px',
      borderRadius: 8,
      border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
      background: dark ? '#1e293b' : '#fff',
      color: dark ? '#f1f5f9' : '#1e293b',
      fontSize: 14,
      outline: 'none',
    },
    filterBtnGroup: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
    },
    filterBtn: (active) => ({
      padding: '10px 16px',
      borderRadius: 8,
      border: `1px solid ${active ? '#3b82f6' : (dark ? '#334155' : '#e2e8f0')}`,
      background: active ? '#3b82f6' : (dark ? '#1e293b' : '#fff'),
      color: active ? '#fff' : (dark ? '#f1f5f9' : '#1e293b'),
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      transition: 'all 0.2s',
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 16,
    },
    card: (status) => {
      let borderColor = dark ? '#334155' : '#e2e8f0';
      let bgColor = dark ? '#1e293b' : '#fff';

      if (status === 'completed') {
        borderColor = '#10b98140';
        bgColor = dark ? '#1e293b' : '#f0fdf4';
      } else if (status === 'in-progress') {
        borderColor = '#3b82f640';
        bgColor = dark ? '#1e293b' : '#eff6ff';
      }

      return {
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: 12,
        padding: 16,
        transition: 'all 0.2s',
        cursor: status !== 'not-started' ? 'pointer' : 'default',
        opacity: status === 'not-started' ? 0.6 : 1,
      };
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    surahNum: {
      fontSize: 14,
      fontWeight: 600,
      color: dark ? '#94a3b8' : '#64748b',
    },
    statusBadge: (status) => {
      let bg = dark ? '#334155' : '#e2e8f0';
      let color = dark ? '#94a3b8' : '#64748b';
      let icon = '⏸️';

      if (status === 'completed') {
        bg = '#10b98120';
        color = '#10b981';
        icon = '✅';
      } else if (status === 'in-progress') {
        bg = '#3b82f620';
        color = '#3b82f6';
        icon = '📖';
      }

      return {
        background: bg,
        color,
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        content: icon,
      };
    },
    surahName: {
      fontSize: 18,
      fontWeight: 700,
      color: dark ? '#f1f5f9' : '#1e293b',
      marginBottom: 12,
      textAlign: isRTL ? 'right' : 'left',
    },
    recordInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 13,
    },
    infoLabel: {
      color: dark ? '#94a3b8' : '#64748b',
    },
    infoValue: {
      fontWeight: 600,
      color: dark ? '#f1f5f9' : '#1e293b',
    },
    scoreValue: (score) => ({
      fontWeight: 700,
      fontSize: 16,
      color: getGrade(score).color,
    }),
    errorBox: {
      background: dark ? '#1e293b' : '#fef2f2',
      border: `1px solid ${dark ? '#334155' : '#fecaca'}`,
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
    },
    errorTitle: {
      fontSize: 12,
      fontWeight: 600,
      color: dark ? '#fca5a5' : '#dc2626',
      marginBottom: 6,
    },
    errorVerses: {
      fontSize: 13,
      color: dark ? '#f1f5f9' : '#1e293b',
      wordBreak: 'break-word',
    },
    notes: {
      fontSize: 13,
      color: dark ? '#94a3b8' : '#64748b',
      fontStyle: 'italic',
      marginTop: 8,
      padding: 8,
      background: dark ? '#0f172a' : '#f8fafc',
      borderRadius: 6,
    },
    emptyState: {
      textAlign: 'center',
      padding: 60,
      color: dark ? '#94a3b8' : '#64748b',
    },
  };

  const getStatusText = (status) => {
    if (status === 'completed') return isRTL ? 'مكتمل' : i18n.language === 'fr' ? 'Terminé' : 'Completed';
    if (status === 'in-progress') return isRTL ? 'قيد المراجعة' : i18n.language === 'fr' ? 'En cours' : 'In Progress';
    return isRTL ? 'لم يبدأ' : i18n.language === 'fr' ? 'Pas commencé' : 'Not Started';
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return '✅';
    if (status === 'in-progress') return '📖';
    return '⏸️';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {isRTL ? 'قائمة السور (114)' : i18n.language === 'fr' ? 'Liste des Sourates (114)' : 'Surah List (114)'}
        </h2>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNum, color: '#10b981' }}>{stats.completed}</div>
            <div style={styles.statLabel}>
              {isRTL ? 'مكتمل' : i18n.language === 'fr' ? 'Terminé' : 'Completed'}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNum, color: '#3b82f6' }}>{stats.inProgress}</div>
            <div style={styles.statLabel}>
              {isRTL ? 'قيد المراجعة' : i18n.language === 'fr' ? 'En cours' : 'In Progress'}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNum, color: '#94a3b8' }}>{stats.notStarted}</div>
            <div style={styles.statLabel}>
              {isRTL ? 'لم يبدأ' : i18n.language === 'fr' ? 'Pas commencé' : 'Not Started'}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNum, color: getGrade(stats.avgScore).color }}>{stats.avgScore}%</div>
            <div style={styles.statLabel}>
              {isRTL ? 'متوسط النتيجة' : i18n.language === 'fr' ? 'Moy. Score' : 'Avg Score'}
            </div>
          </div>
        </div>

        <div style={styles.controls}>
          <input
            type="text"
            placeholder={isRTL ? 'بحث عن سورة...' : i18n.language === 'fr' ? 'Rechercher...' : 'Search surah...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchBox}
          />
          <div style={styles.filterBtnGroup}>
            <button onClick={() => setFilter('all')} style={styles.filterBtn(filter === 'all')}>
              {isRTL ? 'الكل' : i18n.language === 'fr' ? 'Tous' : 'All'} ({surahList.length})
            </button>
            <button onClick={() => setFilter('completed')} style={styles.filterBtn(filter === 'completed')}>
              ✅ {isRTL ? 'مكتمل' : i18n.language === 'fr' ? 'Terminé' : 'Completed'} ({stats.completed})
            </button>
            <button onClick={() => setFilter('in-progress')} style={styles.filterBtn(filter === 'in-progress')}>
              📖 {isRTL ? 'قيد المراجعة' : i18n.language === 'fr' ? 'En cours' : 'In Progress'} ({stats.inProgress})
            </button>
            <button onClick={() => setFilter('not-started')} style={styles.filterBtn(filter === 'not-started')}>
              ⏸️ {isRTL ? 'لم يبدأ' : i18n.language === 'fr' ? 'Pas commencé' : 'Not Started'} ({stats.notStarted})
            </button>
          </div>
        </div>
      </div>

      {filteredSurahs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p>{isRTL ? 'لم يتم العثور على نتائج' : i18n.language === 'fr' ? 'Aucun résultat' : 'No results found'}</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredSurahs.map(surah => {
            const { record, status, name, number } = surah;
            const grade = record ? getGrade(record.score) : null;

            return (
              <div key={number} style={styles.card(status)}>
                <div style={styles.cardHeader}>
                  <span style={styles.surahNum}>#{number}</span>
                  <span style={styles.statusBadge(status)}>
                    {getStatusIcon(status)} {getStatusText(status)}
                  </span>
                </div>

                <div style={styles.surahName}>
                  {isRTL ? 'سورة' : 'Surah'} {name}
                </div>

                {record && (
                  <div style={styles.recordInfo}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>{t('record.score')}:</span>
                      <span style={styles.scoreValue(record.score)}>
                        {grade.emoji} {record.score}%
                      </span>
                    </div>

                    {record.errors > 0 && (
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>{t('record.errors')}:</span>
                        <span style={{ ...styles.infoValue, color: '#ef4444' }}>{record.errors}</span>
                      </div>
                    )}

                    {record.review_start_date && (
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>
                          {isRTL ? 'تاريخ البدء:' : i18n.language === 'fr' ? 'Date début:' : 'Start Date:'}
                        </span>
                        <span style={styles.infoValue}>
                          {new Date(record.review_start_date).toLocaleDateString(
                            i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'fr' ? 'fr-FR' : 'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </span>
                      </div>
                    )}

                    {record.completed && record.completion_date && (
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>
                          {isRTL ? 'تاريخ الإكمال:' : i18n.language === 'fr' ? 'Date fin:' : 'Completed:'}
                        </span>
                        <span style={styles.infoValue}>
                          {new Date(record.completion_date).toLocaleDateString(
                            i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'fr' ? 'fr-FR' : 'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </span>
                      </div>
                    )}

                    {record.errorVerses && (
                      <div style={styles.errorBox}>
                        <div style={styles.errorTitle}>
                          {isRTL ? '⚠️ الآيات الخاطئة:' : i18n.language === 'fr' ? '⚠️ Versets erronés:' : '⚠️ Error Verses:'}
                        </div>
                        <div style={styles.errorVerses}>{record.errorVerses}</div>
                      </div>
                    )}

                    {record.notes && (
                      <div style={styles.notes}>
                        {record.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
