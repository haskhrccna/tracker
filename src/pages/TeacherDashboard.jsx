import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAudio } from '../hooks/useAudio';
import { getGrade } from '../utils/constants';
import { uid, loadActivity, recordDailyActivity, calculateStreak } from '../utils/storage';
import { exportToPDF, exportToCSV } from '../utils/exportUtils';
import { getStyles } from '../utils/styles';
import RecordForm from '../components/RecordForm';
import SettingsPanel from '../components/SettingsPanel';
import Heatmap from '../components/Heatmap';
import { GradeDistributionChart, ScoreProgressChart } from '../components/ScoreChart';
import SuraList from '../components/SuraList';

export default function TeacherDashboard({ user, users, updateUser, logout }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);
  const { playing, loading, playSurah } = useAudio();

  const students = users.filter(u => u.role === "student");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const filteredStudents = students.filter(s =>
    s.fullName.includes(searchQuery) || s.username.includes(searchQuery)
  );

  const student = selectedStudent ? users.find(u => u.id === selectedStudent) : null;

  const addRecord = (record) => {
    updateUser(selectedStudent, u => ({ ...u, records: [...u.records, { ...record, id: uid(), date: new Date().toISOString() }] }));
    recordDailyActivity(selectedStudent);
    setShowAddRecord(false);
  };

  const updateRecord = (recordId, updatedRecord) => {
    updateUser(selectedStudent, u => ({
      ...u, records: u.records.map(r => r.id === recordId ? { ...r, ...updatedRecord } : r)
    }));
    setEditRecord(null);
  };

  const deleteRecord = (recordId) => {
    updateUser(selectedStudent, u => ({ ...u, records: u.records.filter(r => r.id !== recordId) }));
  };

  const overallScore = student?.records?.length
    ? Math.round(student.records.reduce((s, r) => s + r.score, 0) / student.records.length)
    : 0;

  const studentActivity = student ? loadActivity(student.id) : {};
  const streak = student ? calculateStreak(studentActivity) : 0;

  return (
    <div style={s.dashboardLayout}>
      <style>{`
        .mobile-menu-btn { display:none!important; }
        @media(max-width:768px){
          .sidebar{position:fixed!important;${isRTL ? 'right' : 'left'}:0;top:0;bottom:0;z-index:100;transform:translateX(${isRTL ? '100%' : '-100%'});transition:transform .3s}
          .sidebar.open{transform:translateX(0)!important}
          .main-content{margin-right:0!important;padding:16px!important}
          .mobile-menu-btn{display:flex!important;align-items:center;justify-content:center}
        }
      `}</style>

      {/* Mobile menu button */}
      <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={s.mobileMenuBtn}>
        {mobileMenuOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${mobileMenuOpen ? "open" : ""}`} style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <div style={s.sidebarIcon}>👨‍🏫</div>
          <h2 style={s.sidebarTitle}>{t('teacher.dashboard')}</h2>
          <p style={s.sidebarName}>{user.fullName}</p>
        </div>

        <div style={{ padding: "0 16px 12px" }}>
          <input style={s.searchInput} placeholder={`🔍 ${t('teacher.searchStudent')}`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div style={s.studentList}>
          {filteredStudents.length === 0 && (
            <div style={s.emptyMsg}>
              {students.length === 0 ? t('teacher.noStudents') : t('teacher.noResults')}
            </div>
          )}
          {filteredStudents.map(st => {
            const avg = st.records.length ? Math.round(st.records.reduce((a, r) => a + r.score, 0) / st.records.length) : 0;
            const grade = getGrade(avg);
            return (
              <button key={st.id} onClick={() => { setSelectedStudent(st.id); setMobileMenuOpen(false); }}
                style={{ ...s.studentItem, ...(selectedStudent === st.id ? s.studentItemActive : {}) }}>
                <div style={s.studentAvatar}>{st.fullName.charAt(0)}</div>
                <div style={{ flex: 1, textAlign: isRTL ? "right" : "left" }}>
                  <div style={s.studentItemName}>{st.fullName}</div>
                  <div style={s.studentItemMeta}>{st.records.length} {t('teacher.surahs')} • {grade.emoji} {grade.label}</div>
                </div>
                <div style={{ ...s.miniScore, background: grade.color + "22", color: grade.color }}>{avg}%</div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: "0 16px 8px" }}>
          <button onClick={() => setShowSettings(true)} style={{ ...s.logoutBtn, margin: "0 0 8px", width: "100%" }}>
            ⚙️ {t('common.settings')}
          </button>
        </div>
        <button onClick={logout} style={s.logoutBtn}>🚪 {t('common.logout')}</button>
      </div>

      {/* Main Content */}
      <div className="main-content" style={s.mainContent}>
        {!student ? (
          <div style={s.welcomeArea}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>📚</div>
            <h2 style={s.welcomeTitle}>{t('teacher.welcome')} {user.fullName}</h2>
            <p style={s.welcomeText}>{t('teacher.selectStudent')}</p>
            <div style={s.statsRow}>
              <div style={s.statCard}>
                <div style={s.statNumber}>{students.length}</div>
                <div style={s.statLabel}>{t('teacher.totalStudents')}</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statNumber}>{students.reduce((a, s) => a + s.records.length, 0)}</div>
                <div style={s.statLabel}>{t('teacher.totalRecitations')}</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statNumber}>
                  {students.length ? Math.round(students.reduce((a, s) => {
                    const avg = s.records.length ? s.records.reduce((x, r) => x + r.score, 0) / s.records.length : 0;
                    return a + avg;
                  }, 0) / students.length) : 0}%
                </div>
                <div style={s.statLabel}>{t('teacher.overallAverage')}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ animation: "slideIn .4s ease" }}>
            {/* Student Header */}
            <div style={s.studentHeader}>
              <div style={s.studentHeaderRight}>
                <div style={s.bigAvatar}>{student.fullName.charAt(0)}</div>
                <div>
                  <h2 style={s.studentHeaderName}>{student.fullName}</h2>
                  <p style={s.studentHeaderMeta}>@{student.username} • {t('teacher.joined')} {new Date(student.createdAt).toLocaleDateString(i18n.language === 'ar' ? "ar-SA" : i18n.language === 'fr' ? "fr-FR" : "en-US")}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {streak > 0 && (
                  <div style={s.streakBadge}>🔥 {streak} {t('common.streak')}</div>
                )}
                <div style={s.overallGrade}>
                  <div style={{ ...s.gradeCircle, borderColor: getGrade(overallScore).color }}>
                    <span style={{ ...s.gradePercent, color: getGrade(overallScore).color }}>{overallScore}%</span>
                  </div>
                  <div style={{ ...s.gradeLabel, color: getGrade(overallScore).color }}>
                    {getGrade(overallScore).emoji} {getGrade(overallScore).label}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={s.quickStats}>
              <div style={s.qStat}>
                <span style={s.qStatNum}>{student.records.length}</span>
                <span style={s.qStatLabel}>{t('student.recitedSurahs')}</span>
              </div>
              <div style={s.qStat}>
                <span style={s.qStatNum}>{student.records.reduce((a, r) => a + r.errors, 0)}</span>
                <span style={s.qStatLabel}>{t('student.totalErrors')}</span>
              </div>
              <div style={s.qStat}>
                <span style={s.qStatNum}>{student.records.filter(r => r.score >= 90).length}</span>
                <span style={s.qStatLabel}>{t('student.excellentSurahs')}</span>
              </div>
            </div>

            {/* Heatmap */}
            <Heatmap activityMap={studentActivity} />

            {/* Charts */}
            <GradeDistributionChart records={student.records} />
            <ScoreProgressChart records={student.records} />

            {/* Surah List */}
            <div style={{ marginTop: 40, marginBottom: 40 }}>
              <SuraList records={student.records} />
            </div>

            {/* Toolbar: Add Record + Export */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <h3 style={s.sectionTitle}>{t('teacher.recitationLog')}</h3>
              <div style={s.toolbar}>
                <button onClick={() => exportToPDF(student.records, student.fullName, overallScore)} style={s.toolbarBtn}>
                  📄 {t('common.exportPDF')}
                </button>
                <button onClick={() => exportToCSV(student.records, student.fullName)} style={s.toolbarBtn}>
                  📊 {t('common.exportCSV')}
                </button>
                <button onClick={() => setShowAddRecord(true)} style={s.addBtn}>+ {t('teacher.addRecitation')}</button>
              </div>
            </div>

            {/* Add/Edit Record Modal */}
            {(showAddRecord || editRecord) && (
              <RecordForm
                initial={editRecord}
                existingSurahs={editRecord ? [] : student.records.map(r => r.surah)}
                onSave={(data) => editRecord ? updateRecord(editRecord.id, data) : addRecord(data)}
                onCancel={() => { setShowAddRecord(false); setEditRecord(null); }}
              />
            )}

            {/* Records List */}
            {student.records.length === 0 ? (
              <div style={s.emptyRecords}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                <p>{t('record.noRecords')}</p>
              </div>
            ) : (
              <div style={s.recordsGrid}>
                {[...student.records].reverse().map((rec, i) => {
                  const grade = getGrade(rec.score);
                  return (
                    <div key={rec.id} className="record-card" style={{ ...s.recordCard, animationDelay: `${i * 0.05}s` }}>
                      <div style={s.recordTop}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ ...s.recordSurah, background: grade.color + "15", color: grade.color }}>
                            {isRTL ? 'سورة' : ''} {rec.surah}
                          </div>
                          <button
                            onClick={() => playSurah(rec.surah)}
                            style={s.audioBtn}
                            title={t('common.listenAudio')}
                          >
                            {playing === rec.surah ? '⏸️' : loading ? '⏳' : '🔊'} {t('common.listenAudio')}
                          </button>
                        </div>
                        <div style={s.recordActions}>
                          <button onClick={() => setEditRecord(rec)} style={s.iconBtn} title={t('record.edit')}>✏️</button>
                          <button onClick={() => { if (confirm(t('record.confirmDelete'))) deleteRecord(rec.id); }} style={s.iconBtn} title="Delete">🗑️</button>
                        </div>
                      </div>
                      <div style={s.recordBody}>
                        <div style={s.recordScoreRow}>
                          <div style={{ ...s.recordBigScore, color: grade.color }}>{rec.score}<span style={{ fontSize: 14 }}>%</span></div>
                          <span style={{ ...s.recordGradeBadge, background: grade.color + "20", color: grade.color }}>{grade.emoji} {grade.label}</span>
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
        )}
      </div>

      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} style={s.overlay}></div>}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
