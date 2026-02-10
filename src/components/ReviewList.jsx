import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getGrade } from '../utils/constants';
import { getStyles } from '../utils/styles';

export default function ReviewList({ reviews, isTeacher = false, onMarkComplete, onEdit, onDelete, onRetryWhatsApp }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);
  const [expandedReview, setExpandedReview] = useState(null);
  const [retryingWhatsApp, setRetryingWhatsApp] = useState(null);

  const sortedReviews = [...reviews].sort((a, b) => {
    // Sort by review_number descending (newest first)
    return b.review_number - a.review_number;
  });

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: isRTL ? 'مكتمل' : i18n.language === 'fr' ? 'Complété' : 'Completed',
          color: '#10b981',
          bgColor: dark ? '#1e293b' : '#f0fdf4',
          icon: '✅',
        };
      case 'missed':
        return {
          label: isRTL ? 'فائت' : i18n.language === 'fr' ? 'Manqué' : 'Missed',
          color: '#ef4444',
          bgColor: dark ? '#1e293b' : '#fef2f2',
          icon: '❌',
        };
      default: // pending
        return {
          label: isRTL ? 'قيد الانتظار' : i18n.language === 'fr' ? 'En attente' : 'Pending',
          color: '#f59e0b',
          bgColor: dark ? '#1e293b' : '#fffbeb',
          icon: '⏳',
        };
    }
  };

  const isOverdue = (reviewDate, status) => {
    if (status === 'completed') return false;
    return new Date(reviewDate) < new Date();
  };

  const styles = {
    container: {
      maxWidth: 900,
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
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: dark ? '#94a3b8' : '#64748b',
    },
    reviewCard: (status) => ({
      background: getStatusInfo(status).bgColor,
      border: `2px solid ${getStatusInfo(status).color}40`,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      transition: 'all 0.2s',
      cursor: 'pointer',
    }),
    reviewHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    reviewNumberBadge: {
      fontSize: 18,
      fontWeight: 700,
      color: dark ? '#f1f5f9' : '#1e293b',
    },
    statusBadge: (status) => ({
      background: getStatusInfo(status).color + '20',
      color: getStatusInfo(status).color,
      padding: '6px 12px',
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    }),
    reviewMeta: {
      display: 'flex',
      gap: 24,
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 14,
      color: dark ? '#94a3b8' : '#64748b',
    },
    metaIcon: {
      fontSize: 16,
    },
    metaValue: {
      fontWeight: 600,
      color: dark ? '#f1f5f9' : '#1e293b',
    },
    overdueLabel: {
      color: '#ef4444',
      fontWeight: 700,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    surahsPreview: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    surahChip: (completed) => ({
      background: completed ? (dark ? '#065f46' : '#d1fae5') : (dark ? '#1e40af' : '#dbeafe'),
      color: completed ? (dark ? '#6ee7b7' : '#10b981') : (dark ? '#93c5fd' : '#1e40af'),
      padding: '6px 12px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }),
    expandedSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTop: `2px solid ${dark ? '#334155' : '#e2e8f0'}`,
    },
    surahDetailGrid: {
      display: 'grid',
      gap: 12,
      marginTop: 12,
    },
    surahDetail: (completed) => ({
      background: dark ? '#0f172a' : '#fff',
      border: `1px solid ${completed ? '#10b981' : (dark ? '#334155' : '#e2e8f0')}`,
      borderRadius: 8,
      padding: 12,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }),
    surahName: {
      fontSize: 14,
      fontWeight: 600,
      color: dark ? '#f1f5f9' : '#1e293b',
    },
    surahScore: (score) => ({
      fontSize: 16,
      fontWeight: 700,
      color: score ? getGrade(score).color : (dark ? '#64748b' : '#94a3b8'),
    }),
    notes: {
      background: dark ? '#0f172a' : '#fff',
      border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      fontSize: 13,
      color: dark ? '#94a3b8' : '#64748b',
      fontStyle: 'italic',
    },
    emptyState: {
      textAlign: 'center',
      padding: 60,
      color: dark ? '#64748b' : '#94a3b8',
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    whatsappStatus: (status) => {
      let color = dark ? '#64748b' : '#94a3b8';
      let bg = dark ? '#1e293b' : '#f8fafc';
      let icon = '⏳';

      if (status === 'delivered' || status === 'sent') {
        color = '#10b981';
        bg = dark ? '#065f4620' : '#d1fae5';
        icon = '✓';
      } else if (status === 'failed') {
        color = '#ef4444';
        bg = dark ? '#7f1d1d20' : '#fee2e2';
        icon = '✗';
      } else if (status === 'no_number') {
        color = '#f59e0b';
        bg = dark ? '#78350f20' : '#fef3c7';
        icon = '⚠';
      }

      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 6,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 600,
        icon,
      };
    },
    actionButtons: {
      display: 'flex',
      gap: 8,
      marginTop: 12,
    },
    actionBtn: (variant = 'primary') => {
      const colors = {
        primary: { bg: dark ? '#1e40af' : '#3b82f6', color: '#fff' },
        danger: { bg: dark ? '#7f1d1d' : '#ef4444', color: '#fff' },
        secondary: { bg: dark ? '#334155' : '#e2e8f0', color: dark ? '#f1f5f9' : '#1e293b' },
      };
      return {
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        background: colors[variant].bg,
        color: colors[variant].color,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      };
    },
  };

  if (reviews.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📚</div>
          <h3 style={{ fontSize: 18, marginBottom: 8, color: dark ? '#f1f5f9' : '#1e293b' }}>
            {isRTL ? 'لا توجد مراجعات بعد' : i18n.language === 'fr' ? 'Aucune révision' : 'No Reviews Yet'}
          </h3>
          <p>
            {isRTL ? 'سيتم عرض المراجعات المحددة من قبل المعلم هنا' : i18n.language === 'fr' ? 'Les révisions assignées apparaîtront ici' : 'Assigned reviews will appear here'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {isRTL ? 'قائمة المراجعات' : i18n.language === 'fr' ? 'Liste des révisions' : 'Review Sessions'}
        </h2>
        <p style={styles.subtitle}>
          {isRTL ? `إجمالي ${reviews.length} مراجعة` : i18n.language === 'fr' ? `${reviews.length} révision(s) au total` : `Total ${reviews.length} review(s)`}
        </p>
      </div>

      {sortedReviews.map(review => {
        const statusInfo = getStatusInfo(review.status);
        const overdue = isOverdue(review.review_date, review.status);
        const completedCount = review.surahs?.filter(s => s.completed).length || 0;
        const totalCount = review.surahs?.length || 0;
        const isExpanded = expandedReview === review.id;

        return (
          <div
            key={review.id}
            style={styles.reviewCard(review.status)}
            onClick={() => setExpandedReview(isExpanded ? null : review.id)}
          >
            <div style={styles.reviewHeader}>
              <div style={styles.reviewNumberBadge}>
                📝 {isRTL ? `مراجعة رقم ${review.review_number}` : i18n.language === 'fr' ? `Révision #${review.review_number}` : `Review #${review.review_number}`}
              </div>
              <div style={styles.statusBadge(review.status)}>
                {statusInfo.icon} {statusInfo.label}
              </div>
            </div>

            <div style={styles.reviewMeta}>
              <div style={styles.metaItem}>
                <span style={styles.metaIcon}>📅</span>
                <span style={styles.metaValue}>
                  {new Date(review.review_date).toLocaleDateString(
                    i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'fr' ? 'fr-FR' : 'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </span>
              </div>

              <div style={styles.metaItem}>
                <span style={styles.metaIcon}>📖</span>
                <span style={styles.metaValue}>
                  {completedCount}/{totalCount} {isRTL ? 'سور' : i18n.language === 'fr' ? 'sourates' : 'surahs'}
                </span>
              </div>

              {overdue && review.status === 'pending' && (
                <div style={styles.metaItem}>
                  <span style={styles.overdueLabel}>
                    ⚠️ {isRTL ? 'متأخر' : i18n.language === 'fr' ? 'En retard' : 'OVERDUE'}
                  </span>
                </div>
              )}
            </div>

            {!isExpanded && (
              <div style={styles.surahsPreview}>
                {review.surahs?.slice(0, 5).map((surahData, idx) => (
                  <div key={idx} style={styles.surahChip(surahData.completed)}>
                    {surahData.completed && '✓'} {surahData.surah}
                  </div>
                ))}
                {totalCount > 5 && (
                  <div style={styles.surahChip(false)}>
                    +{totalCount - 5} {isRTL ? 'المزيد' : i18n.language === 'fr' ? 'plus' : 'more'}
                  </div>
                )}
              </div>
            )}

            {isExpanded && (
              <div style={styles.expandedSection}>
                <div style={styles.surahDetailGrid}>
                  {review.surahs?.map((surahData, idx) => (
                    <div key={idx} style={styles.surahDetail(surahData.completed)}>
                      <div>
                        <div style={styles.surahName}>
                          {surahData.completed && '✅ '}{isRTL ? 'سورة' : ''} {surahData.surah}
                        </div>
                        {surahData.reviewed_at && (
                          <div style={{ fontSize: 11, color: dark ? '#64748b' : '#94a3b8', marginTop: 4 }}>
                            {new Date(surahData.reviewed_at).toLocaleDateString(
                              i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'fr' ? 'fr-FR' : 'en-US',
                              { month: 'short', day: 'numeric' }
                            )}
                          </div>
                        )}
                      </div>
                      {surahData.score !== null && surahData.score !== undefined && (
                        <div style={styles.surahScore(surahData.score)}>
                          {getGrade(surahData.score).emoji} {surahData.score}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {review.notes && (
                  <div style={styles.notes}>
                    <strong>{isRTL ? 'ملاحظات المعلم:' : i18n.language === 'fr' ? 'Notes:' : 'Teacher Notes:'}</strong> {review.notes}
                  </div>
                )}

                {/* WhatsApp Status for Teachers */}
                {isTeacher && review.whatsapp_status && (
                  <div style={{ marginTop: 12 }}>
                    <div style={styles.whatsappStatus(review.whatsapp_status)}>
                      <span>{styles.whatsappStatus(review.whatsapp_status).icon}</span>
                      <span>
                        {review.whatsapp_status === 'delivered' || review.whatsapp_status === 'sent'
                          ? (isRTL ? 'تم إرسال الواتساب' : i18n.language === 'fr' ? 'WhatsApp envoyé' : 'WhatsApp Delivered')
                          : review.whatsapp_status === 'failed'
                          ? (isRTL ? 'فشل إرسال الواتساب' : i18n.language === 'fr' ? 'Échec WhatsApp' : 'WhatsApp Failed')
                          : review.whatsapp_status === 'no_number'
                          ? (isRTL ? 'لا يوجد رقم واتساب' : i18n.language === 'fr' ? 'Pas de n° WhatsApp' : 'No WhatsApp Number')
                          : (isRTL ? 'قيد الإرسال' : i18n.language === 'fr' ? 'En cours' : 'Sending')}
                      </span>
                    </div>
                    {review.whatsapp_status === 'failed' && onRetryWhatsApp && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRetryingWhatsApp(review.id);
                          onRetryWhatsApp(review.id).finally(() => setRetryingWhatsApp(null));
                        }}
                        disabled={retryingWhatsApp === review.id}
                        style={{
                          ...styles.actionBtn('secondary'),
                          marginTop: 8,
                          opacity: retryingWhatsApp === review.id ? 0.6 : 1,
                        }}
                      >
                        🔄 {retryingWhatsApp === review.id
                          ? (isRTL ? 'جاري الإعادة...' : i18n.language === 'fr' ? 'Réessai...' : 'Retrying...')
                          : (isRTL ? 'إعادة محاولة الواتساب' : i18n.language === 'fr' ? 'Réessayer WhatsApp' : 'Retry WhatsApp')}
                      </button>
                    )}
                  </div>
                )}

                {/* Action Buttons for Teachers */}
                {isTeacher && (onEdit || onDelete) && (
                  <div style={styles.actionButtons} onClick={(e) => e.stopPropagation()}>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(review)}
                        style={styles.actionBtn('primary')}
                      >
                        ✏️ {isRTL ? 'تعديل' : i18n.language === 'fr' ? 'Modifier' : 'Edit'}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذه المراجعة؟' : i18n.language === 'fr' ? 'Supprimer cette révision ?' : 'Delete this review?')) {
                            onDelete(review.id);
                          }
                        }}
                        style={styles.actionBtn('danger')}
                      >
                        🗑️ {isRTL ? 'حذف' : i18n.language === 'fr' ? 'Supprimer' : 'Delete'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
