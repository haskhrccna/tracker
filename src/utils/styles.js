// Theme-aware style generator
export function getStyles(dark, isRTL = true) {
  const bg = dark ? '#0f172a' : '#f0f4f8';
  const cardBg = dark ? '#1e293b' : '#fff';
  const text = dark ? '#e2e8f0' : '#1e293b';
  const textMuted = dark ? '#94a3b8' : '#64748b';
  const textLight = dark ? '#64748b' : '#94a3b8';
  const border = dark ? '#334155' : '#e2e8f0';
  const inputBg = dark ? '#0f172a' : '#fff';
  const hoverBg = dark ? '#334155' : '#f1f5f9';
  const dir = isRTL ? 'rtl' : 'ltr';

  return {
    app: {
      direction: dir,
      fontFamily: "'Tajawal', sans-serif",
      minHeight: "100vh",
      background: bg,
      color: text,
    },
    // Auth
    authBg: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0c4a6e 70%, #164e63 100%)",
      padding: 20,
      position: "relative",
      overflow: "hidden",
    },
    authPattern: {
      position: "absolute",
      inset: 0,
      backgroundImage: `radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.06) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(125, 211, 252, 0.04) 0%, transparent 60%)`,
    },
    authCard: {
      background: dark ? "rgba(30,41,59,0.97)" : "rgba(255,255,255,0.97)",
      borderRadius: 24,
      width: "100%",
      maxWidth: 440,
      boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
      animation: "floatIn .6s ease",
      position: "relative",
      overflow: "hidden",
    },
    authHeader: {
      textAlign: "center",
      padding: "36px 32px 20px",
      background: dark
        ? "linear-gradient(135deg, #1e293b, #0f172a)"
        : "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
      borderBottom: `1px solid ${dark ? '#334155' : '#e0f2fe'}`,
    },
    authIcon: { fontSize: 48, marginBottom: 8 },
    authTitle: { fontFamily: "'Amiri', serif", fontSize: 26, fontWeight: 700, color: dark ? '#7dd3fc' : '#0c4a6e', margin: "0 0 6px" },
    authSubtitle: { fontSize: 14, color: textMuted, margin: 0 },
    tabRow: { display: "flex", borderBottom: `2px solid ${dark ? '#334155' : '#f1f5f9'}` },
    tab: {
      flex: 1, padding: "14px 0", border: "none", background: "none", fontSize: 15, fontWeight: 600,
      color: textLight, cursor: "pointer", fontFamily: "'Tajawal'", borderBottom: "3px solid transparent",
      transition: "all .2s",
    },
    tabActive: { color: "#0369a1", borderBottomColor: "#0369a1" },
    authForm: { padding: "24px 28px 28px" },
    fieldGroup: { marginBottom: 16 },
    label: { display: "block", fontSize: 13, fontWeight: 600, color: dark ? '#94a3b8' : '#475569', marginBottom: 6 },
    input: {
      width: "100%", padding: "12px 14px", border: `2px solid ${border}`, borderRadius: 12,
      fontSize: 15, fontFamily: "'Tajawal'", outline: "none", transition: "border-color .2s",
      boxSizing: "border-box", direction: dir, background: inputBg, color: text,
    },
    eyeBtn: {
      position: "absolute", left: isRTL ? 10 : 'auto', right: isRTL ? 'auto' : 10,
      top: "50%", transform: "translateY(-50%)",
      background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 4,
    },
    roleRow: { display: "flex", gap: 10 },
    roleBtn: {
      flex: 1, padding: "12px", border: `2px solid ${border}`, borderRadius: 12, background: inputBg,
      fontSize: 15, fontFamily: "'Tajawal'", fontWeight: 600, cursor: "pointer", transition: "all .2s",
      color: textMuted,
    },
    roleBtnActive: { borderColor: "#0369a1", background: dark ? '#0c4a6e22' : "#f0f9ff", color: "#0369a1" },
    primaryBtn: {
      width: "100%", padding: "14px", border: "none", borderRadius: 12,
      background: "linear-gradient(135deg, #0369a1, #0284c7)", color: "#fff",
      fontSize: 16, fontWeight: 700, fontFamily: "'Tajawal'", cursor: "pointer",
      boxShadow: "0 4px 14px rgba(3,105,161,0.3)", transition: "transform .15s",
    },
    secondaryBtn: {
      width: "100%", padding: "14px", border: `2px solid ${border}`, borderRadius: 12,
      background: cardBg, color: textMuted, fontSize: 16, fontWeight: 600, fontFamily: "'Tajawal'",
      cursor: "pointer",
    },
    error: {
      background: dark ? "#7f1d1d22" : "#fef2f2", border: `1px solid ${dark ? '#991b1b' : '#fecaca'}`,
      borderRadius: 10, padding: "10px 14px",
      color: "#dc2626", fontSize: 14, marginBottom: 12, textAlign: "center",
    },
    // Dashboard Layout
    dashboardLayout: { display: "flex", minHeight: "100vh", direction: dir },
    sidebar: {
      width: 300, background: "linear-gradient(180deg, #0f172a, #1e3a5f)", color: "#fff",
      display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh",
      overflowY: "auto", flexShrink: 0,
    },
    sidebarHeader: { padding: "28px 20px 20px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" },
    sidebarIcon: { fontSize: 36, marginBottom: 6 },
    sidebarTitle: { fontFamily: "'Amiri', serif", fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "#e0f2fe" },
    sidebarName: { fontSize: 13, color: "#7dd3fc", margin: 0 },
    searchInput: {
      width: "100%", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 10, background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14,
      fontFamily: "'Tajawal'", outline: "none", boxSizing: "border-box", direction: dir,
    },
    studentList: { flex: 1, overflowY: "auto", padding: "8px 10px" },
    studentItem: {
      width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      border: "none", borderRadius: 10, background: "transparent", color: "#cbd5e1",
      cursor: "pointer", fontFamily: "'Tajawal'", textAlign: isRTL ? "right" : "left", transition: "all .2s",
      marginBottom: 4,
    },
    studentItemActive: { background: "rgba(56,189,248,0.15)", color: "#fff" },
    studentAvatar: {
      width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700,
      color: "#fff", flexShrink: 0,
    },
    studentItemName: { fontSize: 14, fontWeight: 600 },
    studentItemMeta: { fontSize: 11, opacity: 0.7, marginTop: 2 },
    miniScore: { fontSize: 12, fontWeight: 700, padding: "4px 8px", borderRadius: 8, flexShrink: 0 },
    logoutBtn: {
      margin: "12px 16px 16px", padding: "12px", border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: 14,
      fontFamily: "'Tajawal'", fontWeight: 600, cursor: "pointer",
    },
    emptyMsg: { textAlign: "center", padding: 20, fontSize: 13, color: "#94a3b8" },
    // Main Content
    mainContent: { flex: 1, padding: 28, marginRight: 0, overflowY: "auto" },
    welcomeArea: { textAlign: "center", paddingTop: 80 },
    welcomeTitle: { fontFamily: "'Amiri', serif", fontSize: 28, color: dark ? '#e0f2fe' : '#0f172a', marginBottom: 8 },
    welcomeText: { fontSize: 16, color: textMuted, marginBottom: 36 },
    statsRow: { display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" },
    statCard: {
      background: cardBg, borderRadius: 16, padding: "24px 32px", minWidth: 140,
      boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.06)", textAlign: "center",
    },
    statNumber: { fontSize: 32, fontWeight: 800, color: "#0369a1", fontFamily: "'Tajawal'" },
    statLabel: { fontSize: 13, color: textMuted, marginTop: 4 },
    // Student Header
    studentHeader: {
      background: cardBg, borderRadius: 20, padding: "24px 28px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.05)", marginBottom: 20, flexWrap: "wrap", gap: 16,
    },
    studentHeaderRight: { display: "flex", alignItems: "center", gap: 16 },
    bigAvatar: {
      width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff",
    },
    studentHeaderName: { fontFamily: "'Amiri', serif", fontSize: 22, margin: 0, color: dark ? '#e0f2fe' : '#0f172a' },
    studentHeaderMeta: { fontSize: 13, color: textLight, margin: "4px 0 0" },
    overallGrade: { textAlign: "center" },
    gradeCircle: {
      width: 70, height: 70, borderRadius: "50%", border: "4px solid", display: "flex",
      alignItems: "center", justifyContent: "center", margin: "0 auto",
    },
    gradePercent: { fontSize: 22, fontWeight: 800 },
    gradeLabel: { fontSize: 14, fontWeight: 700, marginTop: 6 },
    // Quick Stats
    quickStats: { display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" },
    qStat: {
      flex: 1, minWidth: 120, background: cardBg, borderRadius: 14, padding: "16px 20px",
      textAlign: "center", boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
    },
    qStatNum: { display: "block", fontSize: 28, fontWeight: 800, color: "#0369a1" },
    qStatLabel: { display: "block", fontSize: 12, color: textMuted, marginTop: 4 },
    sectionTitle: { fontFamily: "'Amiri', serif", fontSize: 20, color: dark ? '#e0f2fe' : '#0f172a', margin: 0 },
    addBtn: {
      padding: "10px 20px", border: "none", borderRadius: 12,
      background: "linear-gradient(135deg, #0369a1, #0284c7)", color: "#fff",
      fontSize: 14, fontWeight: 700, fontFamily: "'Tajawal'", cursor: "pointer",
      boxShadow: "0 4px 12px rgba(3,105,161,0.25)",
    },
    // Records
    recordsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },
    recordCard: {
      background: cardBg, borderRadius: 16, overflow: "hidden",
      boxShadow: dark ? "0 2px 10px rgba(0,0,0,0.2)" : "0 2px 10px rgba(0,0,0,0.05)",
      animation: "fadeUp .4s ease both",
      transition: "transform .2s, box-shadow .2s",
    },
    recordTop: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 18px 0",
    },
    recordSurah: { fontSize: 15, fontWeight: 700, padding: "6px 14px", borderRadius: 10 },
    recordActions: { display: "flex", gap: 6 },
    iconBtn: {
      background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 4,
      borderRadius: 6, transition: "background .2s",
    },
    recordBody: { padding: "12px 18px 14px" },
    recordScoreRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    recordBigScore: { fontSize: 34, fontWeight: 800 },
    recordGradeBadge: { fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20 },
    recordDetail: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${dark ? '#334155' : '#f1f5f9'}` },
    recordDetailLabel: { color: textLight },
    recordDetailValue: { fontWeight: 600, color: dark ? '#cbd5e1' : '#334155' },
    recordNotes: {
      marginTop: 8, fontSize: 13, color: textMuted, background: dark ? '#0f172a' : '#f8fafc', borderRadius: 8,
      padding: "8px 12px", lineHeight: 1.6,
    },
    recordDate: { padding: "10px 18px", fontSize: 11, color: textLight, borderTop: `1px solid ${dark ? '#334155' : '#f1f5f9'}`, textAlign: isRTL ? "left" : "right" },
    emptyRecords: { textAlign: "center", padding: 40, color: textLight, fontSize: 15 },
    // Modal
    modalOverlay: {
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16,
      backdropFilter: "blur(4px)",
    },
    modal: {
      background: cardBg, borderRadius: 20, width: "100%", maxWidth: 500,
      maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
      animation: "floatIn .3s ease",
    },
    modalHeader: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "20px 24px", borderBottom: `1px solid ${dark ? '#334155' : '#f1f5f9'}`,
    },
    modalTitle: { fontFamily: "'Amiri', serif", fontSize: 20, margin: 0, color: dark ? '#e0f2fe' : '#0f172a' },
    closeBtn: {
      width: 32, height: 32, borderRadius: "50%", border: "none", background: dark ? '#334155' : '#f1f5f9',
      fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: text,
    },
    modalBody: { padding: "20px 24px 24px" },
    modalActions: { display: "flex", gap: 10, marginTop: 16 },
    dropdown: {
      position: "absolute", top: "100%", right: 0, left: 0, background: cardBg,
      borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 200,
      overflowY: "auto", zIndex: 10, border: `1px solid ${border}`, marginTop: 4,
    },
    dropdownItem: {
      width: "100%", padding: "10px 14px", border: "none", background: "none",
      textAlign: isRTL ? "right" : "left", cursor: "pointer", fontSize: 14, fontFamily: "'Tajawal'",
      borderBottom: `1px solid ${dark ? '#1e293b' : '#f8fafc'}`, transition: "background .15s", color: dark ? '#cbd5e1' : '#334155',
    },
    dropdownEmpty: { padding: "12px 14px", textAlign: "center", color: textLight, fontSize: 13 },
    previewGrade: {
      padding: "12px 16px", borderRadius: 12, border: "2px solid", textAlign: "center",
      fontSize: 15, marginBottom: 4,
    },
    // Mobile
    mobileMenuBtn: {
      position: "fixed", top: 16, right: isRTL ? 16 : 'auto', left: isRTL ? 'auto' : 16, zIndex: 200, width: 44, height: 44,
      borderRadius: 12, border: "none", background: "#0f172a", color: "#fff", fontSize: 20,
      cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 99 },
    // Student Dashboard
    studentDashBg: {
      direction: dir, fontFamily: "'Tajawal', sans-serif", minHeight: "100vh",
      background: dark
        ? "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)"
        : "linear-gradient(180deg, #f0f9ff 0%, #f0f4f8 100%)",
      padding: "0 0 40px",
    },
    studentTopBar: {
      display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px",
      background: "linear-gradient(135deg, #0f172a, #1e3a5f)", color: "#fff", flexWrap: "wrap", gap: 12,
    },
    studentTopRight: { display: "flex", alignItems: "center", gap: 12 },
    studentTopAvatar: {
      width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700,
    },
    studentTopName: { fontSize: 18, fontWeight: 700, margin: 0 },
    studentTopMeta: { fontSize: 12, color: "#7dd3fc", margin: "2px 0 0" },
    logoutBtnSmall: {
      padding: "8px 16px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10,
      background: "rgba(255,255,255,0.08)", color: "#e0f2fe", fontSize: 13, fontFamily: "'Tajawal'",
      fontWeight: 600, cursor: "pointer",
    },
    progressCard: {
      margin: "24px auto", maxWidth: 600, background: cardBg, borderRadius: 24,
      boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden",
    },
    progressInner: { padding: "32px 28px" },
    bigCircle: {
      width: 110, height: 110, borderRadius: "50%", border: "6px solid",
      display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
      background: cardBg,
    },
    bigCircleNum: { fontSize: 36, fontWeight: 800 },
    bigGradeLabel: { fontSize: 20, fontWeight: 700 },
    progressSubtext: { fontSize: 13, color: textLight, marginTop: 6 },
    progressStats: { display: "flex", justifyContent: "center", gap: 0, marginTop: 24 },
    pStat: { flex: 1, textAlign: "center" },
    pStatNum: { fontSize: 28, fontWeight: 800, color: "#0369a1" },
    pStatLabel: { fontSize: 12, color: textMuted, marginTop: 2 },
    pStatDivider: { width: 1, background: border, margin: "0 8px" },
    distCard: {
      margin: "0 auto 24px", maxWidth: 600, background: cardBg, borderRadius: 20,
      padding: "24px 28px", boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)",
    },
    distTitle: { fontFamily: "'Amiri', serif", fontSize: 18, margin: "0 0 16px", color: dark ? '#e0f2fe' : '#0f172a' },
    distBars: { display: "flex", flexDirection: "column", gap: 10 },
    distRow: { display: "flex", alignItems: "center", gap: 10 },
    distLabel: { fontSize: 12, fontWeight: 600, width: 90, textAlign: isRTL ? "right" : "left", flexShrink: 0 },
    distBarBg: { flex: 1, height: 10, background: dark ? '#334155' : '#f1f5f9', borderRadius: 6, overflow: "hidden" },
    distBarFill: { height: "100%", borderRadius: 6, transition: "width .6s ease", minWidth: 2 },
    distCount: { fontSize: 13, fontWeight: 700, color: dark ? '#cbd5e1' : '#475569', width: 24, textAlign: "center" },
    studentRecordsSection: { maxWidth: 800, margin: "0 auto", padding: "0 20px" },
    // Toolbar
    toolbar: {
      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
    },
    toolbarBtn: {
      padding: "8px 14px", border: `1px solid ${border}`, borderRadius: 10,
      background: cardBg, color: text, fontSize: 13, fontFamily: "'Tajawal'",
      fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
      transition: "all .2s",
    },
    // Heatmap
    heatmapContainer: {
      background: cardBg, borderRadius: 20, padding: "24px 28px", marginBottom: 20,
      boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)",
    },
    // Streak badge
    streakBadge: {
      display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px",
      borderRadius: 20, background: "linear-gradient(135deg, #f59e0b, #ef4444)",
      color: "#fff", fontSize: 14, fontWeight: 700,
    },
    // Audio button
    audioBtn: {
      padding: "4px 10px", border: `1px solid ${border}`, borderRadius: 8,
      background: dark ? '#1e293b' : '#f0f9ff', color: "#0369a1", fontSize: 12,
      fontFamily: "'Tajawal'", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
    },
    // Settings panel
    settingsPanel: {
      background: cardBg, borderRadius: 20, padding: "24px 28px", marginBottom: 20,
      boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)",
      border: `1px solid ${border}`,
    },
    settingsRow: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 0", borderBottom: `1px solid ${dark ? '#334155' : '#f1f5f9'}`,
    },
    settingsLabel: { fontSize: 14, fontWeight: 600, color: text },
    toggle: (active) => ({
      width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
      background: active ? '#0369a1' : (dark ? '#475569' : '#cbd5e1'),
      position: "relative", transition: "background .2s",
    }),
    toggleDot: (active) => ({
      width: 20, height: 20, borderRadius: "50%", background: "#fff",
      position: "absolute", top: 3,
      left: active ? 25 : 3,
      transition: "left .2s",
    }),
    langSelect: {
      padding: "8px 12px", border: `1px solid ${border}`, borderRadius: 10,
      background: inputBg, color: text, fontSize: 14, fontFamily: "'Tajawal'",
      cursor: "pointer", outline: "none",
    },
  };
}
