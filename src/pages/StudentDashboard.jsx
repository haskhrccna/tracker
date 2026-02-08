import { useState } from 'react';
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

export default function StudentDashboard({ user, logout }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);
  const { playing, loading, playSurah } = useAudio();
  const [showSettings, setShowSettings] = useState(false);

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
                      <span style={s.recordDetailValue}>{rec.errors}</span>
                    </div>
                    {rec.errorVerses && (
                      <div style={s.recordDetail}>
                        <span style={s.recordDetailLabel}>{t('record.errorVersesLabel')}</span>
                        <span style={s.recordDetailValue}>{rec.errorVerses}</span>
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

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
