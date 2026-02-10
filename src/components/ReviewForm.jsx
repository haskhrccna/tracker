import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SURAHS } from '../utils/constants';
import { getStyles } from '../utils/styles';

export default function ReviewForm({ studentId, studentName, nextReviewNumber, initialReview, onSave, onCancel }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);

  const isEditMode = !!initialReview;
  const [reviewNumber] = useState(initialReview?.review_number || nextReviewNumber);
  const [reviewDate, setReviewDate] = useState(initialReview?.review_date || '');
  const [selectedSurahs, setSelectedSurahs] = useState(initialReview?.surahs?.map(s => s.surah || s) || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState(initialReview?.notes || '');
  const [formError, setFormError] = useState('');

  const filteredSurahs = SURAHS.filter(surah =>
    surah.includes(searchTerm) && !selectedSurahs.includes(surah)
  );

  const handleAddSurah = (surah) => {
    setSelectedSurahs([...selectedSurahs, surah]);
    setSearchTerm('');
  };

  const handleRemoveSurah = (surah) => {
    setSelectedSurahs(selectedSurahs.filter(s => s !== surah));
  };

  const handleSave = () => {
    if (!reviewDate) {
      setFormError(isRTL ? 'الرجاء تحديد تاريخ المراجعة' : i18n.language === 'fr' ? 'Sélectionnez une date' : 'Please select review date');
      return;
    }
    if (selectedSurahs.length === 0) {
      setFormError(isRTL ? 'الرجاء اختيار سورة واحدة على الأقل' : i18n.language === 'fr' ? 'Sélectionnez au moins une sourate' : 'Please select at least one surah');
      return;
    }

    const reviewData = {
      student_id: studentId,
      review_number: reviewNumber,
      review_date: reviewDate,
      surahs: selectedSurahs,
      notes,
    };

    if (isEditMode) {
      reviewData.id = initialReview.id;
      reviewData.status = initialReview.status;
      reviewData.whatsapp_status = initialReview.whatsapp_status;
    }

    onSave(reviewData);
  };

  const styles = {
    modalOverlay: s.modalOverlay,
    modal: {
      ...s.modal,
      maxWidth: 700,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      paddingBottom: 16,
      borderBottom: `2px solid ${dark ? '#334155' : '#e2e8f0'}`,
    },
    title: {
      fontSize: 22,
      fontWeight: 700,
      color: dark ? '#f1f5f9' : '#1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    reviewBadge: {
      background: dark ? '#1e40af' : '#dbeafe',
      color: dark ? '#93c5fd' : '#1e40af',
      padding: '6px 14px',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 700,
    },
    studentInfo: {
      background: dark ? '#1e293b' : '#f8fafc',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    studentAvatar: {
      width: 50,
      height: 50,
      borderRadius: '50%',
      background: dark ? '#3b82f6' : '#60a5fa',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 20,
      fontWeight: 700,
    },
    studentName: {
      fontSize: 18,
      fontWeight: 600,
      color: dark ? '#f1f5f9' : '#1e293b',
    },
    fieldGroup: s.fieldGroup,
    label: s.label,
    input: s.input,
    searchSection: {
      marginBottom: 20,
    },
    searchBox: {
      ...s.input,
      marginBottom: 12,
    },
    surahDropdown: {
      maxHeight: 200,
      overflowY: 'auto',
      background: dark ? '#1e293b' : '#fff',
      border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 8,
      marginTop: -8,
    },
    surahOption: {
      padding: '10px 14px',
      cursor: 'pointer',
      transition: 'background 0.2s',
      borderBottom: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
      fontSize: 14,
      color: dark ? '#f1f5f9' : '#1e293b',
    },
    selectedSurahs: {
      marginBottom: 20,
    },
    selectedTitle: {
      fontSize: 14,
      fontWeight: 600,
      color: dark ? '#94a3b8' : '#64748b',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    surahChipsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
    },
    surahChip: {
      background: dark ? '#1e40af' : '#dbeafe',
      color: dark ? '#93c5fd' : '#1e40af',
      padding: '8px 12px',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    removeBtn: {
      background: dark ? '#7f1d1d' : '#fecaca',
      color: dark ? '#fca5a5' : '#dc2626',
      border: 'none',
      width: 20,
      height: 20,
      borderRadius: '50%',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      textAlign: 'center',
      padding: 30,
      color: dark ? '#64748b' : '#94a3b8',
      fontSize: 14,
      fontStyle: 'italic',
    },
    error: s.error,
    actions: {
      display: 'flex',
      gap: 12,
      marginTop: 24,
      paddingTop: 20,
      borderTop: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
    },
    saveBtn: {
      ...s.primaryBtn,
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
    },
    cancelBtn: {
      ...s.secondaryBtn,
      flex: 1,
    },
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.title}>
            {isEditMode ? '✏️' : '📝'} {isEditMode
              ? (isRTL ? 'تعديل المراجعة' : i18n.language === 'fr' ? 'Modifier la révision' : 'Edit Review')
              : (isRTL ? 'إنشاء مراجعة جديدة' : i18n.language === 'fr' ? 'Créer une révision' : 'Create New Review')}
            <span style={styles.reviewBadge}>
              {isRTL ? `مراجعة رقم ${reviewNumber}` : i18n.language === 'fr' ? `Révision #${reviewNumber}` : `Review #${reviewNumber}`}
            </span>
          </div>
          <button onClick={onCancel} style={s.closeBtn}>✕</button>
        </div>

        <div style={styles.studentInfo}>
          <div style={styles.studentAvatar}>{studentName.charAt(0)}</div>
          <div>
            <div style={styles.studentName}>{studentName}</div>
            <div style={{ fontSize: 13, color: dark ? '#94a3b8' : '#64748b' }}>
              {isRTL ? 'الطالب' : i18n.language === 'fr' ? 'Étudiant' : 'Student'}
            </div>
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            {isRTL ? 'تاريخ المراجعة' : i18n.language === 'fr' ? 'Date de révision' : 'Review Date'}
          </label>
          <input
            style={styles.input}
            type="date"
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div style={styles.searchSection}>
          <label style={styles.label}>
            {isRTL ? 'إضافة السور للمراجعة' : i18n.language === 'fr' ? 'Ajouter des sourates' : 'Add Surahs to Review'}
          </label>
          <input
            style={styles.searchBox}
            type="text"
            placeholder={isRTL ? 'ابحث عن سورة...' : i18n.language === 'fr' ? 'Rechercher...' : 'Search surah...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && filteredSurahs.length > 0 && (
            <div style={styles.surahDropdown}>
              {filteredSurahs.slice(0, 10).map(surah => (
                <div
                  key={surah}
                  style={styles.surahOption}
                  onClick={() => handleAddSurah(surah)}
                  onMouseOver={(e) => e.currentTarget.style.background = dark ? '#334155' : '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {isRTL ? 'سورة' : 'Surah'} {surah}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.selectedSurahs}>
          <div style={styles.selectedTitle}>
            {isRTL ? `السور المحددة (${selectedSurahs.length})` : i18n.language === 'fr' ? `Sourates sélectionnées (${selectedSurahs.length})` : `Selected Surahs (${selectedSurahs.length})`}
          </div>
          {selectedSurahs.length === 0 ? (
            <div style={styles.emptyState}>
              {isRTL ? 'لم يتم اختيار أي سورة بعد' : i18n.language === 'fr' ? 'Aucune sourate sélectionnée' : 'No surahs selected yet'}
            </div>
          ) : (
            <div style={styles.surahChipsContainer}>
              {selectedSurahs.map(surah => (
                <div key={surah} style={styles.surahChip}>
                  <span>{isRTL ? 'سورة' : ''} {surah}</span>
                  <button
                    style={styles.removeBtn}
                    onClick={() => handleRemoveSurah(surah)}
                    title={isRTL ? 'إزالة' : i18n.language === 'fr' ? 'Supprimer' : 'Remove'}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            {isRTL ? 'ملاحظات (اختياري)' : i18n.language === 'fr' ? 'Notes (optionnel)' : 'Notes (optional)'}
          </label>
          <textarea
            style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
            placeholder={isRTL ? 'أضف ملاحظات للطالب...' : i18n.language === 'fr' ? 'Ajouter des notes...' : 'Add notes for student...'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {formError && <div style={styles.error}>{formError}</div>}

        <div style={styles.actions}>
          <button onClick={handleSave} style={styles.saveBtn}>
            ✅ {isEditMode
              ? (isRTL ? 'حفظ التغييرات' : i18n.language === 'fr' ? 'Enregistrer' : 'Save Changes')
              : (isRTL ? 'إنشاء المراجعة وإرسال الإشعار' : i18n.language === 'fr' ? 'Créer et notifier' : 'Create & Notify Student')}
          </button>
          <button onClick={onCancel} style={styles.cancelBtn}>
            {isRTL ? 'إلغاء' : i18n.language === 'fr' ? 'Annuler' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
