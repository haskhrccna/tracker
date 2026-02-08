import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SURAHS, getGrade } from '../utils/constants';
import { getStyles } from '../utils/styles';

export default function RecordForm({ initial, existingSurahs, onSave, onCancel }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);

  const [surah, setSurah] = useState(initial?.surah || "");
  const [score, setScore] = useState(initial?.score?.toString() || "");
  const [errors, setErrors] = useState(initial?.errors?.toString() || "0");
  const [errorVerses, setErrorVerses] = useState(initial?.errorVerses || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [formError, setFormError] = useState("");
  const [surahSearch, setSurahSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredSurahs = SURAHS.filter(s =>
    s.includes(surahSearch) && !existingSurahs.includes(s)
  );

  const handleSave = () => {
    if (!surah) { setFormError(t('record.selectSurah')); return; }
    const sc = parseInt(score);
    if (isNaN(sc) || sc < 0 || sc > 100) { setFormError(t('record.invalidScore')); return; }
    const e = parseInt(errors);
    if (isNaN(e) || e < 0) { setFormError(t('record.invalidErrors')); return; }
    onSave({ surah, score: sc, errors: e, errorVerses, notes });
  };

  return (
    <div style={s.modalOverlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitle}>{initial ? t('record.edit') : t('record.addNew')}</h3>
          <button onClick={onCancel} style={s.closeBtn}>✕</button>
        </div>

        <div style={s.modalBody}>
          <div style={s.fieldGroup}>
            <label style={s.label}>{t('record.surahName')}</label>
            {initial ? (
              <div style={{ ...s.input, background: dark ? '#0f172a' : '#f1f5f9', display: "flex", alignItems: "center" }}>{surah}</div>
            ) : (
              <div style={{ position: "relative" }}>
                <input style={s.input} placeholder={t('record.searchSurah')}
                  value={surah || surahSearch}
                  onChange={e => { setSurahSearch(e.target.value); setSurah(""); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)} />
                {showDropdown && surahSearch && (
                  <div style={s.dropdown}>
                    {filteredSurahs.slice(0, 10).map(su => (
                      <button key={su} onClick={() => { setSurah(su); setSurahSearch(""); setShowDropdown(false); }} style={s.dropdownItem}>
                        {isRTL ? 'سورة' : 'Surah'} {su}
                      </button>
                    ))}
                    {filteredSurahs.length === 0 && <div style={s.dropdownEmpty}>{t('record.surahNotFound')}</div>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={s.fieldGroup}>
              <label style={s.label}>{t('record.score')}</label>
              <input style={s.input} type="number" min="0" max="100" placeholder="95" value={score} onChange={e => setScore(e.target.value)} />
            </div>
            <div style={s.fieldGroup}>
              <label style={s.label}>{t('record.errorCount')}</label>
              <input style={s.input} type="number" min="0" placeholder="0" value={errors} onChange={e => setErrors(e.target.value)} />
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>{t('record.errorVerses')}</label>
            <input style={s.input} placeholder={t('record.errorVersesPlaceholder')} value={errorVerses} onChange={e => setErrorVerses(e.target.value)} />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>{t('record.notes')}</label>
            <textarea style={{ ...s.input, minHeight: 70, resize: "vertical" }} placeholder={t('record.notesPlaceholder')} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {score && !isNaN(parseInt(score)) && (
            <div style={{ ...s.previewGrade, borderColor: getGrade(parseInt(score)).color + "40", background: getGrade(parseInt(score)).color + "08" }}>
              <span>{t('record.gradePreview')} </span>
              <span style={{ color: getGrade(parseInt(score)).color, fontWeight: 700 }}>
                {getGrade(parseInt(score)).emoji} {getGrade(parseInt(score)).label}
              </span>
            </div>
          )}

          {formError && <div style={s.error}>{formError}</div>}

          <div style={s.modalActions}>
            <button onClick={handleSave} style={s.primaryBtn}>
              {initial ? t('record.save') : t('record.add')}
            </button>
            <button onClick={onCancel} style={s.secondaryBtn}>{t('record.cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
