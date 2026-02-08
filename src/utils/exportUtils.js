import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getGrade } from './constants';

export function exportToCSV(records, studentName) {
  const headers = ['Surah', 'Score', 'Grade', 'Errors', 'Error Verses', 'Notes', 'Date'];
  const rows = records.map(r => {
    const grade = getGrade(r.score);
    return [
      r.surah,
      r.score,
      grade.label,
      r.errors,
      r.errorVerses || '',
      r.notes || '',
      new Date(r.date).toLocaleDateString('en-US'),
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `quran-tracker-${studentName || 'report'}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(records, studentName, overallScore) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(3, 105, 161);
  doc.text('Quran Memorization Report', 105, 20, { align: 'center' });

  // Student info
  doc.setFontSize(14);
  doc.setTextColor(51, 65, 85);
  doc.text(`Student: ${studentName}`, 105, 32, { align: 'center' });

  doc.setFontSize(12);
  const grade = getGrade(overallScore);
  doc.text(`Overall Score: ${overallScore}% - ${grade.labelEn}`, 105, 40, { align: 'center' });
  doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 105, 48, { align: 'center' });

  // Summary stats
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  const totalRecords = records.length;
  const totalErrors = records.reduce((a, r) => a + r.errors, 0);
  const excellentCount = records.filter(r => r.score >= 90).length;
  doc.text(`Total Recitations: ${totalRecords}  |  Total Errors: ${totalErrors}  |  Excellent: ${excellentCount}`, 105, 58, { align: 'center' });

  // Table
  const tableData = records.map(r => {
    const g = getGrade(r.score);
    return [
      r.surah,
      `${r.score}%`,
      g.labelEn,
      r.errors.toString(),
      r.errorVerses || '-',
      new Date(r.date).toLocaleDateString('en-US'),
    ];
  });

  doc.autoTable({
    startY: 65,
    head: [['Surah', 'Score', 'Grade', 'Errors', 'Error Verses', 'Date']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [3, 105, 161],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [240, 249, 255],
    },
  });

  doc.save(`quran-tracker-${studentName || 'report'}.pdf`);
}
