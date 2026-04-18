import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  loadUsers,
  saveUsers,
  uid,
  loadActivity,
  saveActivity,
  recordDailyActivity,
  calculateStreak,
} from './storage.js';
import {
  createNotification as createLocalNotification,
  loadNotifications as loadLocalNotifications,
  markNotificationAsRead as markLocalNotificationAsRead,
  markAllNotificationsAsRead as markLocalAllNotificationsAsRead,
  deleteNotification as deleteLocalNotification,
  getUnreadCount as getLocalUnreadCount,
} from './notificationService.js';

export const backendEnabled = () => isSupabaseConfigured();

export async function signIn(usernameOrEmail, password) {
  if (!backendEnabled()) {
    const users = loadUsers();
    const user = users.find(
      u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password,
    );
    return { data: user || null, error: user ? null : { message: 'Invalid credentials' } };
  }

  const email = usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@qurantracker.local`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUp({ username, email, password, role = 'student', fullName, language }) {
  const status = 'pending';

  if (!backendEnabled()) {
    const users = loadUsers();
    if (users.find(u => u.username === username || (email && u.email === email))) {
      return { data: null, error: { message: 'User already exists' } };
    }

    const newUser = {
      id: uid(),
      username,
      email: email || null,
      password,
      role,
      fullName,
      language: language || 'ar',
      whatsapp_number: null,
      status,
      records: [],
      reviews: [],
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    return { data: newUser, error: null };
  }

  const signupEmail = email || `${username}@qurantracker.local`;
  const { data: authData, error: authError } = await supabase.auth.signUp({ email: signupEmail, password });
  if (authError) return { data: null, error: authError };

  const profile = {
    id: authData.user?.id || uid(),
    username,
    email: signupEmail,
    role,
    status,
    full_name: fullName,
    preferred_language: language || 'ar',
    whatsapp_number: null,
    created_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase.from('profiles').insert([profile]);
  if (insertError) return { data: null, error: insertError };

  // Create notification for admin
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  if (admins && admins.length > 0) {
    const notifications = admins.map(admin => ({
      user_id: admin.id,
      type: 'user_signup_request',
      title: 'New User Signup Request',
      message: `${fullName} (${username}) has requested to join as ${role}. Please review and approve.`,
      related_id: profile.id,
    }));
    await supabase.from('notifications').insert(notifications);
  }

  return { data: authData.user ? { ...profile, id: authData.user.id } : profile, error: null };
}

export async function signOut() {
  if (!backendEnabled()) return { data: null, error: null };
  return supabase.auth.signOut();
}

export async function getSession() {
  if (!backendEnabled()) return { data: null, error: null };
  return supabase.auth.getSession();
}

export async function getCurrentUser() {
  if (!backendEnabled()) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const { data: profile } = await supabase.from('users').select('*, records(*), reviews(*)').eq('id', data.user.id).single();
  return profile || null;
}

export async function fetchUserById(userId) {
  if (!backendEnabled()) {
    const users = loadUsers();
    return users.find(u => u.id === userId) || null;
  }

  const { data, error } = await supabase.from('users').select('*, records(*), reviews(*)').eq('id', userId).single();
  return data || null;
}

export async function fetchUsers() {
  if (!backendEnabled()) return loadUsers();
  const { data, error } = await supabase.from('users').select('*, records(*), reviews(*)');
  return data || [];
}

export async function fetchStudentRecords(userId) {
  if (!backendEnabled()) {
    const user = await fetchUserById(userId);
    return user?.records || [];
  }

  const { data, error } = await supabase.from('records').select('*').eq('user_id', userId).order('date', { ascending: false });
  return data || [];
}

export async function fetchStudentReviews(userId) {
  if (!backendEnabled()) {
    const user = await fetchUserById(userId);
    return user?.reviews || [];
  }

  const { data, error } = await supabase.from('reviews').select('*').eq('student_id', userId).order('review_number', { ascending: false });
  return data || [];
}

export async function fetchTeacherStudents(teacherId) {
  if (!backendEnabled()) {
    const users = loadUsers();
    return users.filter(u => u.role === 'student');
  }

  const { data, error } = await supabase.from('users').select('*, records(*), reviews(*)').eq('role', 'student');
  return data || [];
}

export async function updateUserProfile(userId, updates) {
  if (!backendEnabled()) {
    const users = loadUsers();
    const next = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    saveUsers(next);
    return { data: next.find(u => u.id === userId), error: null };
  }

  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId);
  return { data: data?.[0] || null, error };
}

export async function updateProfileStatus(userId, status) {
  if (!backendEnabled()) {
    const users = loadUsers();
    const next = users.map(u => u.id === userId ? { ...u, status } : u);
    saveUsers(next);
    return { data: next.find(u => u.id === userId), error: null };
  }

  const { data, error } = await supabase.from('profiles').update({ status }).eq('id', userId);
  return { data: data?.[0] || null, error };
}

export async function addTeacher({ username, email, password, fullName, language }) {
  if (!backendEnabled()) {
    const users = loadUsers();
    if (users.find(u => u.username === username || (email && u.email === email))) {
      return { data: null, error: { message: 'User already exists' } };
    }

    const newUser = {
      id: uid(),
      username,
      email: email || null,
      password,
      role: 'teacher',
      fullName,
      language: language || 'ar',
      whatsapp_number: null,
      status: 'active',
      records: [],
      reviews: [],
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    return { data: newUser, error: null };
  }

  const signupEmail = email || `${username}@qurantracker.local`;
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email: signupEmail, password });
  if (authError) return { data: null, error: authError };

  const profile = {
    id: authData.user?.id || uid(),
    username,
    email: signupEmail,
    role: 'teacher',
    status: 'active',
    full_name: fullName,
    preferred_language: language || 'ar',
    whatsapp_number: null,
    created_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase.from('profiles').insert([profile]);
  return { data: authData.user ? { ...profile, id: authData.user.id } : profile, error: insertError };
}

export async function fetchPendingUsers() {
  if (!backendEnabled()) {
    const users = loadUsers();
    return users.filter(u => u.status === 'pending');
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('status', 'pending');
  return data || [];
}

export async function fetchAllUsers() {
  if (!backendEnabled()) {
    return loadUsers();
  }

  const { data, error } = await supabase.from('profiles').select('*');
  return data || [];
}

export async function fetchNotifications(userId) {
  if (!backendEnabled()) {
    return loadLocalNotifications(userId);
  }

  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
}

export async function markNotificationAsRead(notifId) {
  if (!backendEnabled()) {
    return markLocalNotificationAsRead(notifId);
  }

  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notifId);
  return { error };
}


export function loadClasses() {
  try {
    const data = localStorage.getItem('quran-tracker-classes');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveClasses(classes) {
  try {
    localStorage.setItem('quran-tracker-classes', JSON.stringify(classes));
  } catch (e) {
    console.error('Class storage error:', e);
  }
}

export function loadClassMembers() {
  try {
    const data = localStorage.getItem('quran-tracker-class-members');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveClassMembers(members) {
  try {
    localStorage.setItem('quran-tracker-class-members', JSON.stringify(members));
  } catch (e) {
    console.error('Class member storage error:', e);
  }
}

export async function fetchClassesForTeacher(teacherId) {
  if (!backendEnabled()) {
    return loadClasses().filter(cl => cl.teacher_id === teacherId);
  }

  const { data, error } = await supabase.from('classes').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: true });
  return data || [];
}

export async function createClass(teacherId, classData) {
  if (!backendEnabled()) {
    const classes = loadClasses();
    const newClass = { id: uid(), teacher_id: teacherId, ...classData, created_at: new Date().toISOString() };
    saveClasses([...classes, newClass]);
    return { data: newClass, error: null };
  }

  const { data, error } = await supabase.from('classes').insert([{ teacher_id: teacherId, ...classData }]);
  return { data: data?.[0] || null, error };
}

export async function addStudentToClass(classId, studentId) {
  if (!backendEnabled()) {
    const members = loadClassMembers();
    const existing = members.find(cm => cm.class_id === classId && cm.student_id === studentId);
    if (existing) return { data: existing, error: null };
    const newMember = { id: uid(), class_id: classId, student_id: studentId, created_at: new Date().toISOString() };
    saveClassMembers([...members, newMember]);
    return { data: newMember, error: null };
  }

  const { data, error } = await supabase.from('class_members').insert([{ class_id: classId, student_id: studentId }]);
  return { data: data?.[0] || null, error };
}

export async function removeStudentFromClass(classId, studentId) {
  if (!backendEnabled()) {
    const members = loadClassMembers().filter(cm => !(cm.class_id === classId && cm.student_id === studentId));
    saveClassMembers(members);
    return { data: null, error: null };
  }

  const { error } = await supabase.from('class_members').delete().match({ class_id: classId, student_id: studentId });
  return { data: null, error };
}

export async function saveRecord(userId, record) {
  if (!backendEnabled()) {
    const users = loadUsers();
    const next = users.map(u => u.id === userId ? { ...u, records: [...(u.records || []), record] } : u);
    saveUsers(next);
    return { data: record, error: null };
  }

  const { data, error } = await supabase.from('records').insert([{ ...record, user_id: userId }]);
  return { data: data?.[0] || null, error };
}

export async function updateRecord(userId, recordId, updates) {
  if (!backendEnabled()) {
    const users = loadUsers();
    const next = users.map(u => u.id === userId ? {
      ...u,
      records: (u.records || []).map(r => r.id === recordId ? { ...r, ...updates } : r),
    } : u);
    saveUsers(next);
    return { data: next.find(u => u.id === userId)?.records?.find(r => r.id === recordId) || null, error: null };
  }

  const { data, error } = await supabase.from('records').update(updates).eq('id', recordId);
  return { data: data?.[0] || null, error };
}

export async function deleteRecord(userId, recordId) {
  if (!backendEnabled()) {
    const users = loadUsers();
    const next = users.map(u => u.id === userId ? {
      ...u,
      records: (u.records || []).filter(r => r.id !== recordId),
    } : u);
    saveUsers(next);
    return { data: null, error: null };
  }

  const { error } = await supabase.from('records').delete().eq('id', recordId);
  return { data: null, error };
}

export async function saveReview(studentId, review) {
  if (!backendEnabled()) {
    const users = loadUsers();
    const next = users.map(u => u.id === studentId ? { ...u, reviews: [...(u.reviews || []), review] } : u);
    saveUsers(next);
    return { data: review, error: null };
  }

  const { data, error } = await supabase.from('reviews').insert([{ ...review, student_id: studentId }]);
  return { data: data?.[0] || null, error };
}

export async function updateReview(studentId, reviewId, updates) {
  if (!backendEnabled()) {
    const users = loadUsers();
    const next = users.map(u => u.id === studentId ? {
      ...u,
      reviews: (u.reviews || []).map(r => r.id === reviewId ? { ...r, ...updates } : r),
    } : u);
    saveUsers(next);
    return { data: next.find(u => u.id === studentId)?.reviews?.find(r => r.id === reviewId) || null, error: null };
  }

  const { data, error } = await supabase.from('reviews').update(updates).eq('id', reviewId);
  return { data: data?.[0] || null, error };
}

export async function deleteReview(studentId, reviewId) {
  if (!backendEnabled()) {
    const users = loadUsers();
    const next = users.map(u => u.id === studentId ? {
      ...u,
      reviews: (u.reviews || []).filter(r => r.id !== reviewId),
    } : u);
    saveUsers(next);
    return { data: null, error: null };
  }

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  return { data: null, error };
}

export async function getNotifications(userId) {
  if (!backendEnabled()) return loadLocalNotifications(userId);
  const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
}

export async function createNotification(userId, type, title, message, relatedId = null, whatsappStatus = null) {
  if (!backendEnabled()) return createLocalNotification(userId, type, title, message, relatedId, whatsappStatus);
  const { data, error } = await supabase.from('notifications').insert([{ user_id: userId, type, title, message, related_id: relatedId, whatsapp_status: whatsappStatus, read: false, created_at: new Date().toISOString() }]);
  return { data: data?.[0] || null, error };
}

export async function markNotificationRead(userId, notificationId) {
  if (!backendEnabled()) return markLocalNotificationAsRead(userId, notificationId);
  return supabase.from('notifications').update({ read: true }).eq('id', notificationId);
}

export async function markAllNotificationsRead(userId) {
  if (!backendEnabled()) return markLocalAllNotificationsAsRead(userId);
  return supabase.from('notifications').update({ read: true }).eq('user_id', userId);
}

export async function removeNotification(userId, notificationId) {
  if (!backendEnabled()) return deleteLocalNotification(userId, notificationId);
  return supabase.from('notifications').delete().eq('id', notificationId);
}

export async function getUnreadNotificationCount(userId) {
  if (!backendEnabled()) return getLocalUnreadCount(userId);
  const { data, error } = await supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', userId).eq('read', false);
  return data?.length || 0;
}

export async function loadUserActivity(userId) {
  if (!backendEnabled()) return loadActivity(userId);
  return loadActivity(userId);
}

export async function saveUserActivity(userId, activity) {
  if (!backendEnabled()) return saveActivity(userId, activity);
  return saveActivity(userId, activity);
}

export async function recordActivity(userId) {
  if (!backendEnabled()) return recordDailyActivity(userId);
  return recordDailyActivity(userId);
}

export async function getActivityStreak(activityMap) {
  return calculateStreak(activityMap);
}
