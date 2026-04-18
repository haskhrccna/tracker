import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAudio } from '../hooks/useAudio';
import { getGrade, GRADE_THRESHOLDS } from '../utils/constants';
import { loadActivity, calculateStreak } from '../utils/storage';
import { exportToPDF, exportToCSV } from '../utils/exportUtils';
import { getStyles } from '../utils/styles';
import SettingsPanel from '../components/SettingsPanel';
import Heatmap from '../components/Heatmap';
import { GradeDistributionChart, ScoreProgressChart } from '../components/ScoreChart';
import SuraList from '../components/SuraList';
import ReviewList from '../components/ReviewList';
import NotificationPanel from '../components/NotificationPanel';
import { getUnreadCount } from '../utils/notificationService';

export default function StudentDashboard({ user, logout }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);
  const { playing, loading, playSurah } = useAudio();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('progress'); // progress, reviews

  // Load unread notifications count
  useEffect(() => {
    setUnreadCount(getUnreadCount(user.id));
  }, [user.id]);

  const overallScore = user.records.length
    ? Math.round(user.records.reduce((s, r) => s + r.score, 0) / user.records.length)
    : 0;
  const grade = getGrade(overallScore);
  const activity = loadActivity(user.id);
  const streak = calculateStreak(activity);

  return (
    <div style={s.studentDashBg}>
      {/* Top Bar */}
      <div style={s.studentTopBar}>
        <div style={s.studentTopRight}>
          <div style={s.studentTopAvatar}>{user.fullName.charAt(0)}</div>
          <div>
            <h2 style={s.studentTopName}>{user.fullName}</h2>
            <p style={s.studentTopMeta}>{t('student.account')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {streak > 0 && (
            <div style={s.streakBadge}>🔥 {streak} {t('common.streak')}</div>
          )}
          <button
            onClick={() => {
              setShowNotifications(true);
              setUnreadCount(0);
            }}
            style={{
              ...s.logoutBtnSmall,
              position: 'relative',
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                width: 18,
                height: 18,
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => setShowSettings(true)} style={s.logoutBtnSmall}>⚙️</button>
          <button onClick={logout} style={s.logoutBtnSmall}>🚪 {t('common.logoutShort')}</button>
        </div>
      </div>

      {/* Overall Progress Card */}
      <div style={s.progressCard}>
        <div style={s.progressInner}>
          <div style={{ textAlign: "center" }}>
            <div style={{ ...s.bigCircle, borderColor: grade.color }}>
              <span style={{ ...s.bigCircleNum, color: grade.color }}>{overallScore}%</span>
            </div>
            <div style={{ ...s.bigGradeLabel, color: grade.color, marginTop: 12 }}>{grade.emoji} {grade.label}</div>
            <p style={s.progressSubtext}>{t('student.overallGrade')}</p>
          </div>
          <div style={s.progressStats}>
            <div style={s.pStat}>
              <div style={s.pStatNum}>{user.records.length}</div>
              <div style={s.pStatLabel}>{t('student.surah')}</div>
            </div>
            <div style={s.pStatDivider}></div>
            <div style={s.pStat}>
              <div style={s.pStatNum}>{user.records.reduce((a, r) => a + r.errors, 0)}</div>
              <div style={s.pStatLabel}>{t('student.error')}</div>
            </div>
            <div style={s.pStatDivider}></div>
            <div style={s.pStat}>
              <div style={s.pStatNum}>{user.records.filter(r => r.score >= 90).length}</div>
              <div style={s.pStatLabel}>{t('student.excellent')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto 24px',
        padding: '0 20px',
      }}>
        <div style={{
          display: 'flex',
          gap: 12,
          borderBottom: `2px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
        }}>
          <button
            onClick={() => setActiveTab('progress')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'progress' ? `3px solid #3b82f6` : '3px solid transparent',
              color: activeTab === 'progress' ? (dark ? '#f1f5f9' : '#1e293b') : (dark ? '#64748b' : '#94a3b8'),
              fontWeight: activeTab === 'progress' ? 700 : 400,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: -2,
            }}
          >
            📊 {isRTL ? 'التقدم والأداء' : i18n.language === 'fr' ? 'Progrès' : 'Progress'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'reviews' ? `3px solid #3b82f6` : '3px solid transparent',
              color: activeTab === 'reviews' ? (dark ? '#f1f5f9' : '#1e293b') : (dark ? '#64748b' : '#94a3b8'),
              fontWeight: activeTab === 'reviews' ? 700 : 400,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: -2,
            }}
          >
            📝 {isRTL ? 'المراجعات' : i18n.language === 'fr' ? 'Révisions' : 'Reviews'}
            {user.reviews?.length > 0 && ` (${user.reviews.length})`}
          </button>
        </div>
      </div>

      {activeTab === 'progress' && (
        <>
          {/* Heatmap */}
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
            <Heatmap activityMap={activity} />
          </div>

      {/* Charts */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px' }}>
        <GradeDistributionChart records={user.records} />
        <ScoreProgressChart records={user.records} />
      </div>

      {/* Score Distribution (bar-style, kept for mobile) */}
      {user.records.length > 0 && (
        <div style={s.distCard}>
          <h3 style={s.distTitle}>{t('student.gradeDistribution')}</h3>
          <div style={s.distBars}>
            {GRADE_THRESHOLDS.map(g => {
              const count = user.records.filter(r => getGrade(r.score).label === g.label).length;
              const pct = user.records.length ? (count / user.records.length) * 100 : 0;
              const label = i18n.language === 'en' ? g.labelEn : i18n.language === 'fr' ? g.labelFr : g.label;
              return (
                <div key={g.label} style={s.distRow}>
                  <span style={{ ...s.distLabel, color: g.color }}>{g.emoji} {label}</span>
                  <div style={s.distBarBg}>
                    <div style={{ ...s.distBarFill, width: `${pct}%`, background: g.color }}></div>
                  </div>
                  <span style={s.distCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Surah List */}
      <div style={{ marginTop: 40, marginBottom: 40 }}>
        <SuraList records={user.records} />
      </div>

      {/* Export toolbar */}
      <div style={{ maxWidth: 800, margin: '0 auto 16px', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ ...s.sectionTitle, marginBottom: 0 }}>{t('student.recitationLog')}</h3>
          {user.records.length > 0 && (
            <div style={s.toolbar}>
              <button onClick={() => exportToPDF(user.records, user.fullName, overallScore)} style={s.toolbarBtn}>
                📄 {t('common.exportPDF')}
              </button>
              <button onClick={() => exportToCSV(user.records, user.fullName)} style={s.toolbarBtn}>
                📊 {t('common.exportCSV')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Records */}
      <div style={s.studentRecordsSection}>
        {user.records.length === 0 ? (
          <div style={s.emptyRecords}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
            <p>{t('student.noRecitations')}</p>
          </div>
        ) : (
          <div style={s.recordsGrid}>
            {[...user.records].reverse().map((rec, i) => {
              const g = getGrade(rec.score);
              return (
                <div key={rec.id} className="record-card" style={{ ...s.recordCard, animation: `fadeUp .4s ease ${i * .05}s both` }}>
                  <div style={s.recordTop}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ ...s.recordSurah, background: g.color + "15", color: g.color }}>
                        {isRTL ? 'سورة' : ''} {rec.surah}
                      </div>
                      <button
                        onClick={() => playSurah(rec.surah)}
                        style={s.audioBtn}
                        title={t('common.listenAudio')}
                      >
                        {playing === rec.surah ? '⏸️' : '🔊'}
                      </button>
                    </div>
                  </div>
                  <div style={s.recordBody}>
                    <div style={s.recordScoreRow}>
                      <div style={{ ...s.recordBigScore, color: g.color }}>{rec.score}<span style={{ fontSize: 14 }}>%</span></div>
                      <span style={{ ...s.recordGradeBadge, background: g.color + "20", color: g.color }}>{g.emoji} {g.label}</span>
                    </div>
                    <div style={s.recordDetail}>
                      <span style={s.recordDetailLabel}>{t('record.errors')}</span>
                      <span style={{ ...s.recordDetailValue, color: rec.errors > 0 ? '#ef4444' : '#10b981' }}>
                        {rec.errors === 0 ? '✓ ' : ''}{rec.errors}
                      </span>
                    </div>
                    {rec.errorVerses && (
                      <div style={{
                        background: dark ? '#1e293b' : '#fef2f2',
                        border: `2px solid ${dark ? '#7f1d1d' : '#fca5a5'}`,
                        borderRadius: 8,
                        padding: 10,
                        marginTop: 8,
                      }}>
                        <div style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: dark ? '#fca5a5' : '#dc2626',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: 6,
                        }}>
                          ⚠️ {t('record.errorVersesLabel')}
                        </div>
                        <div style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: dark ? '#f1f5f9' : '#1e293b',
                          wordBreak: 'break-word',
                        }}>
                          {rec.errorVerses}
                        </div>
                      </div>
                    )}
                    {rec.review_start_date && (
                      <div style={s.recordDetail}>
                        <span style={s.recordDetailLabel}>
                          {isRTL ? 'بدء المراجعة' : i18n.language === 'fr' ? 'Début' : 'Started'}
                        </span>
                        <span style={s.recordDetailValue}>
                          {new Date(rec.review_start_date).toLocaleDateString(
                            i18n.language === 'ar' ? "ar-SA" : i18n.language === 'fr' ? "fr-FR" : "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      </div>
                    )}
                    {rec.completed && (
                      <div style={{
                        background: dark ? '#1e293b' : '#f0fdf4',
                        border: `2px solid ${dark ? '#065f46' : '#86efac'}`,
                        borderRadius: 8,
                        padding: 8,
                        marginTop: 8,
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        color: dark ? '#6ee7b7' : '#10b981',
                      }}>
                        ✅ {isRTL ? 'مكتمل' : i18n.language === 'fr' ? 'Complété' : 'Completed'}
                        {rec.completion_date && ` • ${new Date(rec.completion_date).toLocaleDateString(
                          i18n.language === 'ar' ? "ar-SA" : i18n.language === 'fr' ? "fr-FR" : "en-US",
                          { month: "short", day: "numeric" }
                        )}`}
                      </div>
                    )}
                    {rec.notes && <div style={s.recordNotes}>{rec.notes}</div>}
                  </div>
                  <div style={s.recordDate}>
                    {new Date(rec.date).toLocaleDateString(
                      i18n.language === 'ar' ? "ar-SA" : i18n.language === 'fr' ? "fr-FR" : "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}

      {activeTab === 'reviews' && (
        <div style={{ marginTop: 20 }}>
          <ReviewList reviews={user.reviews || []} isTeacher={false} />
        </div>
      )}

      {showSettings && <SettingsPanel userId={user.id} onClose={() => setShowSettings(false)} />}
      {showNotifications && (
        <NotificationPanel
          userId={user.id}
          onClose={() => {
            setShowNotifications(false);
            setUnreadCount(getUnreadCount(user.id));
          }}
        />
      )}
    </div>
  );
}
