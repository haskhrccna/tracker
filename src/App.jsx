import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { loadUsers, saveUsers, uid } from './utils/storage';
import { getStyles } from './utils/styles';
import AuthPage from './pages/AuthPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

function AppInner() {
  const { dark } = useTheme();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);

  const [users, setUsers] = useState(() => loadUsers());
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("login");

  // Save users whenever they change
  useEffect(() => {
    saveUsers(users);
  }, [users]);

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) { setCurrentUser(user); setPage("dashboard"); return true; }
    return false;
  };

  const register = (username, password, role, fullName) => {
    if (users.find(u => u.username === username)) return false;
    const newUser = { id: uid(), username, password, role, fullName, records: [], createdAt: new Date().toISOString() };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setPage("dashboard");
    return true;
  };

  const updateUser = (userId, updater) => {
    setUsers(prev => {
      const next = prev.map(u => u.id === userId ? updater(u) : u);
      const me = next.find(u => u.id === currentUser?.id);
      if (me) setCurrentUser(me);
      return next;
    });
  };

  const logout = () => { setCurrentUser(null); setPage("login"); };

  return (
    <div style={s.app}>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes floatIn { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(15px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(${isRTL ? '20px' : '-20px'})} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        input:focus, textarea:focus { border-color: #0369a1 !important; box-shadow: 0 0 0 3px rgba(3,105,161,0.1) !important; }
        button:hover { opacity: 0.92; }
        .record-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important; }
        * { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,0.3) transparent; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 3px; }
      `}</style>
      {page === "login" && <AuthPage login={login} register={register} />}
      {page === "dashboard" && currentUser?.role === "teacher" && (
        <TeacherDashboard user={currentUser} users={users} updateUser={updateUser} logout={logout} />
      )}
      {page === "dashboard" && currentUser?.role === "student" && (
        <StudentDashboard user={currentUser} logout={logout} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
