import { supabase } from '../lib/supabase.js';
import {
  loadActivity,
  saveActivity,
  recordDailyActivity,
  calculateStreak,
} from './storage.js';

export async function signIn(usernameOrEmail, password) {
  const email = usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@qurantracker.local`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUp({ username, email, password, role = 'student', fullName, language }) {
  const signupEmail = email || `${username}@qurantracker.local`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: signupEmail,
    password,
    options: {
      data: { username, full_name: fullName, role, language: language || 'ar' },
      emailRedirectTo: window.location.origin,
    },
  });
  if (authError) return { data: null, error: authError };

  // The database trigger (handle_new_user) creates the profile automatically.
  // Notify admins about the new signup.
  const profile = {
    id: authData.user?.id,
    username,
    email: signupEmail,
    role,
    status: 'pending',
    full_name: fullName,
    preferred_language: language || 'ar',
  };

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

  return { data: { ...profile, id: authData.user?.id }, error: null };
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, records(*), reviews(*)')
    .eq('id', data.user.id)
    .single();
  return profile || null;
}

export async function fetchUserById(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*, records(*), reviews(*)')
    .eq('id', userId)
    .single();
  return data || null;
}

export async function fetchUsers() {
  const { data } = await supabase
    .from('profiles')
    .select('*, records(*), reviews(*)');
  return data || [];
}

export async function fetchStudentRecords(userId) {
  const { data } = await supabase
    .from('records')
    .select('*')
    .eq('student_id', userId)
    .order('date', { ascending: false });
  return data || [];
}

export async function fetchStudentReviews(userId) {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('student_id', userId)
    .order('review_number', { ascending: false });
  return data || [];
}

export async function fetchTeacherStudents(teacherId) {
  const { data } = await supabase
    .from('profiles')
    .select('*, records(*), reviews(*)')
    .eq('role', 'student');
  return data || [];
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data: data || null, error };
}

export async function updateProfileStatus(userId, status) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', userId)
    .select()
    .single();
  return { data: data || null, error };
}

export async function addTeacher({ username, email, password, fullName, language }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: { message: 'Not authenticated' } };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/add-teacher`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password, fullName, language }),
  });

  return response.json();
}

export async function fetchPendingUsers() {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'pending');
  return data || [];
}

export async function fetchAllUsers() {
  const { data } = await supabase
    .from('profiles')
    .select('*');
  return data || [];
}

export async function fetchNotifications(userId) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function markNotificationAsRead(notifId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notifId);
  return { error };
}

export async function fetchClassesForTeacher(teacherId) {
  const { data } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function createClass(teacherId, classData) {
  const { data, error } = await supabase
    .from('classes')
    .insert([{ teacher_id: teacherId, ...classData }])
    .select()
    .single();
  return { data: data || null, error };
}

export async function addStudentToClass(classId, studentId) {
  const { data, error } = await supabase
    .from('class_members')
    .insert([{ class_id: classId, student_id: studentId }])
    .select()
    .single();
  return { data: data || null, error };
}

export async function removeStudentFromClass(classId, studentId) {
  const { error } = await supabase
    .from('class_members')
    .delete()
    .match({ class_id: classId, student_id: studentId });
  return { data: null, error };
}

export async function saveRecord(userId, record) {
  const { data, error } = await supabase
    .from('records')
    .insert([{ ...record, student_id: userId }])
    .select()
    .single();
  return { data: data || null, error };
}

export async function updateRecord(userId, recordId, updates) {
  const { data, error } = await supabase
    .from('records')
    .update(updates)
    .eq('id', recordId)
    .select()
    .single();
  return { data: data || null, error };
}

export async function deleteRecord(userId, recordId) {
  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', recordId);
  return { data: null, error };
}

export async function saveReview(studentId, review) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([{ ...review, student_id: studentId }])
    .select()
    .single();
  return { data: data || null, error };
}

export async function updateReview(studentId, reviewId, updates) {
  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .select()
    .single();
  return { data: data || null, error };
}

export async function deleteReview(studentId, reviewId) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);
  return { data: null, error };
}

export async function getNotifications(userId) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function createNotification(userId, type, title, message, relatedId = null, whatsappStatus = null) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedId,
      whatsapp_status: whatsappStatus,
      read: false,
    }])
    .select()
    .single();
  return { data: data || null, error };
}

export async function markNotificationRead(userId, notificationId) {
  return supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
}

export async function markAllNotificationsRead(userId) {
  return supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId);
}

export async function removeNotification(userId, notificationId) {
  return supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
}

export async function getUnreadNotificationCount(userId) {
  const { data } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('read', false);
  return data?.length || 0;
}

export async function loadUserActivity(userId) {
  return loadActivity(userId);
}

export async function saveUserActivity(userId, activity) {
  return saveActivity(userId, activity);
}

export async function recordActivity(userId) {
  return recordDailyActivity(userId);
}

export async function getActivityStreak(activityMap) {
  return calculateStreak(activityMap);
}
