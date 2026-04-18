import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { loadUsers, saveUsers, uid } from './utils/storage';
import {
  backendEnabled,
  signIn,
  signUp,
  signOut,
  getSession,
  getCurrentUser,
  fetchUsers,
  fetchTeacherStudents,
  fetchUserById,
  fetchStudentRecords,
  fetchStudentReviews,
  updateUserProfile,
} from './utils/db';
import { getStyles } from './utils/styles';
import AuthPage from './pages/AuthPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppInner() {
  const { dark } = useTheme();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);

  const [users, setUsers] = useState(() => (backendEnabled() ? [] : loadUsers()));
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!backendEnabled()) {
      saveUsers(users);
      setLoading(false);
      return;
    }

    (async () => {
      const session = await getSession();
      if (session?.data?.session?.user) {
        const profile = await getCurrentUser();
        if (profile) {
          if (profile.status !== 'active') {
            setCurrentUser(null);
            setPage('login');
            alert('Your account is pending approval.');
            return;
          }
          const records = await fetchStudentRecords(profile.id);
          const reviews = await fetchStudentReviews(profile.id);
          setCurrentUser({ ...profile, records, reviews });
          setPage('dashboard');
          if (profile.role === 'teacher') {
            const teacherStudents = await fetchTeacherStudents(profile.id);
            setStudents(teacherStudents);
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const login = async (username, password) => {
    if (backendEnabled()) {
      const { data, error } = await signIn(username, password);
      if (error) return false;
      const profile = await getCurrentUser();
      if (!profile) return false;
      if (profile.status !== 'active') {
        alert('Your account is pending approval. Please wait for admin approval.');
        return false;
      }
      const records = await fetchStudentRecords(profile.id);
      const reviews = await fetchStudentReviews(profile.id);
      setCurrentUser({ ...profile, records, reviews });
      setPage('dashboard');
      if (profile.role === 'teacher') {
        const teacherStudents = await fetchTeacherStudents(profile.id);
        setStudents(teacherStudents);
      }
      return true;
    }

    const usersList = loadUsers();
    const user = usersList.find(u => u.username === username && u.password === password);
    if (user && user.status === 'active') {
      setCurrentUser(user);
      setPage('dashboard');
      return true;
    }
    if (user && user.status !== 'active') {
      alert('Your account is pending approval.');
      return false;
    }
    return false;
  };

  const register = async ({ username, password, email, role, fullName, language }) => {
    if (backendEnabled()) {
      const { data, error } = await signUp({ username, password, email, role, fullName, language });
      if (error || !data) return false;
      alert('Registration successful! Your account is pending admin approval. You will receive an email once approved.');
      return true;
    }

    const usersList = loadUsers();
    if (usersList.find(u => u.username === username)) return false;
    const newUser = { id: uid(), username, password, email: email || null, role, fullName, language: language || 'ar', status: 'pending', records: [], reviews: [], createdAt: new Date().toISOString() };
    const next = [...usersList, newUser];
    setUsers(next);
    alert('Registration successful! Your account is pending admin approval.');
    return true;
  };

  const updateUser = async (userId, updater) => {
    if (backendEnabled()) {
      const current = await fetchUserById(userId);
      if (!current) return;
      const updated = updater(current);
      const { data, error } = await updateUserProfile(userId, {
        full_name: updated.fullName || updated.full_name,
        whatsapp_number: updated.whatsapp_number,
        language: updated.language,
      });
      if (data) {
        setCurrentUser(prev => prev?.id === userId ? { ...prev, ...updated } : prev);
      }
      return;
    }

    setUsers(prev => {
      const next = prev.map(u => u.id === userId ? updater(u) : u);
      const me = next.find(u => u.id === currentUser?.id);
      if (me) setCurrentUser(me);
      return next;
    });
  };

  const logout = async () => {
    if (backendEnabled()) {
      await signOut();
    }
    setCurrentUser(null);
    setPage('login');
  };

  if (loading) {
    return (
      <div style={s.app}>
        <div style={{ padding: 32, fontSize: 18, color: dark ? '#f8fafc' : '#0f172a' }}>Loading...</div>
      </div>
    );
  }

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
      {page === 'login' && <AuthPage login={login} register={register} backendEnabled={backendEnabled()} />}
      {page === 'dashboard' && currentUser?.role === 'teacher' && (
        <TeacherDashboard
          user={currentUser}
          users={backendEnabled() ? students : users}
          updateUser={updateUser}
          logout={logout}
          backendEnabled={backendEnabled()}
        />
      )}
      {page === 'dashboard' && currentUser?.role === 'admin' && (
        <AdminDashboard
          user={currentUser}
          logout={logout}
          backendEnabled={backendEnabled()}
        />
      )}
      {page === 'dashboard' && currentUser?.role === 'student' && (
        <StudentDashboard user={currentUser} logout={logout} backendEnabled={backendEnabled()} />
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
