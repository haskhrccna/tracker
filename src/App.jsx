import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { supabase } from './lib/supabase';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  fetchStudentRecords,
  fetchStudentReviews,
  fetchTeacherStudents,
  updateUserProfile,
  fetchUserById,
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

  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState('login');
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (userId) => {
    const profile = await getCurrentUser();
    if (!profile) return null;
    if (profile.status !== 'active') return null;

    const records = await fetchStudentRecords(profile.id);
    const reviews = await fetchStudentReviews(profile.id);
    const user = { ...profile, records, reviews };
    setCurrentUser(user);
    setPage('dashboard');

    if (profile.role === 'teacher') {
      const teacherStudents = await fetchTeacherStudents(profile.id);
      setStudents(teacherStudents);
    }

    return user;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          const profile = await getCurrentUser();
          if (!profile) {
            setLoading(false);
            return;
          }
          if (profile.status !== 'active') {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setPage('login');
            setLoading(false);
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
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setStudents([]);
          setPage('login');
          setLoading(false);
        }
      }
    );

    // Initial check in case onAuthStateChange doesn't fire for existing sessions
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
      // If there is a session, onAuthStateChange will handle it
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const login = async (username, password) => {
    const { error } = await signIn(username, password);
    if (error) return false;
    // onAuthStateChange will handle setting currentUser and page
    // But we need to wait for profile load and check status
    const profile = await getCurrentUser();
    if (!profile) return false;
    if (profile.status !== 'active') {
      alert('Your account is pending approval. Please wait for admin approval.');
      await supabase.auth.signOut();
      return false;
    }
    return true;
  };

  const register = async ({ username, password, email, role, fullName, language }) => {
    const { data, error } = await signUp({ username, password, email, role, fullName, language });
    if (error || !data) return false;
    alert('Registration successful! Your account is pending admin approval. You will receive an email once approved.');
    return true;
  };

  const updateUser = async (userId, updater) => {
    const current = await fetchUserById(userId);
    if (!current) return;
    const updated = updater(current);
    const { data } = await updateUserProfile(userId, {
      full_name: updated.fullName || updated.full_name,
      whatsapp_number: updated.whatsapp_number,
      language: updated.language,
    });
    if (data) {
      setCurrentUser(prev => prev?.id === userId ? { ...prev, ...updated } : prev);
    }
  };

  const logout = async () => {
    await signOut();
    setCurrentUser(null);
    setStudents([]);
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
      {page === 'login' && <AuthPage login={login} register={register} />}
      {page === 'dashboard' && currentUser?.role === 'teacher' && (
        <TeacherDashboard
          user={currentUser}
          users={students}
          updateUser={updateUser}
          logout={logout}
        />
      )}
      {page === 'dashboard' && currentUser?.role === 'admin' && (
        <AdminDashboard
          user={currentUser}
          logout={logout}
        />
      )}
      {page === 'dashboard' && currentUser?.role === 'student' && (
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
