import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAudio } from '../hooks/useAudio';
import { getGrade } from '../utils/constants';
import { uid, loadActivity, recordDailyActivity, calculateStreak } from '../utils/storage';
import {
  saveRecord,
  updateRecord as updateDbRecord,
  deleteRecord as deleteDbRecord,
  saveReview,
  updateReview as updateDbReview,
  deleteReview as deleteDbReview,
} from '../utils/db';
import { exportToPDF, exportToCSV } from '../utils/exportUtils';
import { getStyles } from '../utils/styles';
import RecordForm from '../components/RecordForm';
import SettingsPanel from '../components/SettingsPanel';
import Heatmap from '../components/Heatmap';
import { GradeDistributionChart, ScoreProgressChart } from '../components/ScoreChart';
import SuraList from '../components/SuraList';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import { notifyReviewAssigned } from '../utils/notificationService';

export default function TeacherDashboard({ user, users, updateUser, logout, backendEnabled }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);
  const { playing, loading, playSurah } = useAudio();

  const [studentList, setStudentList] = useState(users);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddRecord, setShowAddRecord] = useState(false);

  useEffect(() => {
    setStudentList(users);
  }, [users]);
  const [editRecord, setEditRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editReview, setEditReview] = useState(null);
  const [activeTab, setActiveTab] = useState('progress'); // progress, reviews

  const filteredStudents = studentList.filter(s =>
    s.fullName.includes(searchQuery) || s.username?.includes(searchQuery)
  );

  const student = selectedStudent ? studentList.find(u => u.id === selectedStudent) : null;

  const syncStudent = (studentId, updater) => {
    setStudentList(prev => prev.map(u => u.id === studentId ? updater(u) : u));
  };

  const addRecord = async (record) => {
    const newRecord = { ...record, id: uid(), date: new Date().toISOString() };
    if (backendEnabled) {
      const { data, error } = await saveRecord(selectedStudent, newRecord);
      if (error) {
        console.error('Save record failed', error);
        return;
      }
      syncStudent(selectedStudent, u => ({ ...u, records: [...(u.records || []), data] }));
    } else {
      updateUser(selectedStudent, u => ({ ...u, records: [...(u.records || []), newRecord] }));
      syncStudent(selectedStudent, u => ({ ...u, records: [...(u.records || []), newRecord] }));
    }
    recordDailyActivity(selectedStudent);
    setShowAddRecord(false);
  };

  const updateRecord = async (recordId, updatedRecord) => {
    if (backendEnabled) {
      const { data, error } = await updateDbRecord(selectedStudent, recordId, updatedRecord);
      if (error) {
        console.error('Update record failed', error);
        return;
      }
      syncStudent(selectedStudent, u => ({
        ...u,
        records: (u.records || []).map(r => r.id === recordId ? { ...r, ...data } : r),
      }));
    } else {
      updateUser(selectedStudent, u => ({
        ...u, records: u.records.map(r => r.id === recordId ? { ...r, ...updatedRecord } : r),
      }));
      syncStudent(selectedStudent, u => ({
        ...u,
        records: (u.records || []).map(r => r.id === recordId ? { ...r, ...updatedRecord } : r),
      }));
    }
    setEditRecord(null);
  };

  const deleteRecord = async (recordId) => {
    if (backendEnabled) {
      const { error } = await deleteDbRecord(selectedStudent, recordId);
      if (error) {
        console.error('Delete record failed', error);
        return;
      }
    } else {
      updateUser(selectedStudent, u => ({ ...u, records: u.records.filter(r => r.id !== recordId) }));
    }
    syncStudent(selectedStudent, u => ({ ...u, records: (u.records || []).filter(r => r.id !== recordId) }));
  };

  // Review management
  const createReview = async (reviewData) => {
    const review = {
      id: uid(),
      ...reviewData,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    review.surahs = reviewData.surahs.map(surah => ({
      surah,
      completed: false,
      score: null,
      errors: 0,
      reviewed_at: null,
    }));

    if (backendEnabled) {
      const { data, error } = await saveReview(selectedStudent, review);
      if (error) {
        console.error('Save review failed', error);
        return;
      }
      syncStudent(selectedStudent, u => ({
        ...u,
        reviews: [...(u.reviews || []), data],
      }));
    } else {
      updateUser(selectedStudent, u => ({
        ...u,
        reviews: [...(u.reviews || []), review],
      }));
      syncStudent(selectedStudent, u => ({
        ...u,
        reviews: [...(u.reviews || []), review],
      }));
    }

    const studentData = student || users.find(u => u.id === selectedStudent);
    const result = await notifyReviewAssigned(studentData, review, true);
    if (result?.whatsappResult) {
      const updatedStatus = result.whatsappResult.success ? 'delivered' : 'failed';
      const updatePayload = { whatsapp_status: updatedStatus };
      if (backendEnabled) {
        await updateDbReview(selectedStudent, review.id, updatePayload);
      }
      syncStudent(selectedStudent, u => ({
        ...u,
        reviews: (u.reviews || []).map(r => r.id === review.id ? { ...r, ...updatePayload } : r),
      }));
    }

    setShowReviewForm(false);
  };

  const updateReview = async (reviewData) => {
    if (backendEnabled) {
      const { data, error } = await updateDbReview(selectedStudent, reviewData.id, {
        ...reviewData,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Update review failed', error);
        return;
      }
      syncStudent(selectedStudent, u => ({
        ...u,
        reviews: (u.reviews || []).map(r => r.id === reviewData.id ? { ...r, ...data } : r),
      }));
    } else {
      updateUser(selectedStudent, u => ({
        ...u,
        reviews: (u.reviews || []).map(r => r.id === reviewData.id ? { ...r, ...reviewData, updated_at: new Date().toISOString() } : r),
      }));
      syncStudent(selectedStudent, u => ({
        ...u,
        reviews: (u.reviews || []).map(r => r.id === reviewData.id ? { ...r, ...reviewData, updated_at: new Date().toISOString() } : r),
      }));
    }
    setEditReview(null);
    setShowReviewForm(false);
  };

  const deleteReview = async (reviewId) => {
    if (backendEnabled) {
      const { error } = await deleteDbReview(selectedStudent, reviewId);
      if (error) {
        console.error('Delete review failed', error);
        return;
      }
    } else {
      updateUser(selectedStudent, u => ({
        ...u,
        reviews: (u.reviews || []).filter(r => r.id !== reviewId),
      }));
    }
    syncStudent(selectedStudent, u => ({
      ...u,
      reviews: (u.reviews || []).filter(r => r.id !== reviewId),
    }));
  };

  const handleEditReview = (review) => {
    setEditReview(review);
    setShowReviewForm(true);
  };

  const handleSaveReview = (reviewData) => {
    if (editReview) {
      updateReview(reviewData);
    } else {
      createReview(reviewData);
    }
  };

  const retryWhatsAppForReview = async (reviewId) => {
    const review = student.reviews?.find(r => r.id === reviewId);
    if (!review) return;

    const studentData = users.find(u => u.id === selectedStudent);
    const result = await notifyReviewAssigned(studentData, review, true);

    // Update review with new WhatsApp status
    if (result?.whatsappResult) {
      updateUser(selectedStudent, u => ({
        ...u,
        reviews: (u.reviews || []).map(r =>
          r.id === reviewId ? { ...r, whatsapp_status: result.whatsappResult.success ? 'delivered' : 'failed' } : r
        ),
      }));
    }
  };

  const getNextReviewNumber = () => {
    const studentReviews = student?.reviews || [];
    if (studentReviews.length === 0) return 1;
    return Math.max(...studentReviews.map(r => r.review_number)) + 1;
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

            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              gap: 12,
              marginBottom: 24,
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
                📊 {isRTL ? 'التقدم والأداء' : i18n.language === 'fr' ? 'Progrès' : 'Progress & Performance'}
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
                {student.reviews?.length > 0 && ` (${student.reviews.length})`}
              </button>
            </div>

            {activeTab === 'progress' && (
              <>
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
              </>
            )}

            {activeTab === 'reviews' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={s.sectionTitle}>
                    {isRTL ? 'المراجعات المحددة' : i18n.language === 'fr' ? 'Révisions assignées' : 'Assigned Reviews'}
                  </h3>
                  <button
                    onClick={() => setShowReviewForm(true)}
                    style={{
                      ...s.primaryBtn,
                      background: dark ? '#1e40af' : '#3b82f6',
                      padding: '10px 20px',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    ➕ {isRTL ? 'إنشاء مراجعة جديدة' : i18n.language === 'fr' ? 'Nouvelle révision' : 'Create New Review'}
                  </button>
                </div>

                <ReviewList
                  reviews={student.reviews || []}
                  isTeacher={true}
                  onEdit={handleEditReview}
                  onDelete={deleteReview}
                  onRetryWhatsApp={retryWhatsAppForReview}
                />

                {showReviewForm && (
                  <ReviewForm
                    studentId={student.id}
                    studentName={student.fullName}
                    nextReviewNumber={getNextReviewNumber()}
                    initialReview={editReview}
                    onSave={handleSaveReview}
                    onCancel={() => {
                      setShowReviewForm(false);
                      setEditReview(null);
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} style={s.overlay}></div>}
      {showSettings && <SettingsPanel userId={user.id} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
