// src/utils/adminOps.js
//
// Admin operations that require server-side privilege (service role key).
// These call Edge Functions rather than manipulating the database directly,
// so the service role key never reaches the browser.
//
// Deploy the matching Edge Functions:
//   supabase functions deploy admin-reset-password
//   supabase functions deploy admin-set-password
//   supabase functions deploy admin-create-teacher
//   supabase functions deploy admin-approve-user
//   supabase functions deploy admin-delete-user
//   supabase functions deploy send-notification-email

import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { loadUsers, saveUsers } from './storage.js';

function backendEnabled() {
  return isSupabaseConfigured();
}

/**
 * Reset a user's password.
 * Admin-triggered — generates a temp password, sets must_reset_password=true.
 * The user can then sign in with the returned temp password and will be forced
 * to create a new one.
 *
 * Returns { success: true, tempPassword } on success.
 */
export async function adminResetUserPassword(userId) {
  if (!backendEnabled()) {
    // Local/demo fallback — no real auth, so we just flag the profile
    const users = loadUsers();
    const tempPassword = 'temp-' + Math.random().toString(36).slice(2, 10);
    const next = users.map(u => u.id === userId
      ? { ...u, password: tempPassword, must_reset_password: true }
      : u);
    saveUsers(next);
    return { success: true, tempPassword };
  }

  const { data, error } = await supabase.functions.invoke('admin-reset-password', {
    body: { userId },
  });
  if (error) throw error;
  return data;
}

/**
 * Set a user's password to a specific value (admin override, no forced reset).
 */
export async function adminSetUserPassword(userId, newPassword) {
  if (!backendEnabled()) {
    const users = loadUsers();
    saveUsers(users.map(u => u.id === userId
      ? { ...u, password: newPassword, must_reset_password: false }
      : u));
    return { success: true };
  }

  const { data, error } = await supabase.functions.invoke('admin-set-password', {
    body: { userId, newPassword },
  });
  if (error) throw error;
  return data;
}

/**
 * Create a teacher account. Replaces the old in-browser addTeacher() which
 * required the service role key to be exposed client-side.
 */
export async function adminCreateTeacherSecure({ username, email, password, fullName, language }) {
  if (!backendEnabled()) {
    // Local fallback
    const users = loadUsers();
    if (users.find(u => u.username === username)) {
      throw new Error('Username already taken');
    }
    const newTeacher = {
      id: 'local-' + Date.now(),
      username,
      email: email || `${username}@qurantracker.local`,
      password,
      full_name: fullName,
      fullName,
      role: 'teacher',
      status: 'active',
      language: language || 'ar',
      must_reset_password: false,
      records: [],
      reviews: [],
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newTeacher]);
    return newTeacher;
  }

  const { data, error } = await supabase.functions.invoke('admin-create-teacher', {
    body: { username, email, password, fullName, language },
  });
  if (error) throw error;
  return data;
}

/**
 * Approve a pending user (sets status=active and notifies them).
 */
export async function adminApproveUserSecure(userId) {
  if (!backendEnabled()) {
    const users = loadUsers();
    saveUsers(users.map(u => u.id === userId ? { ...u, status: 'active' } : u));
    return { success: true };
  }

  const { data, error } = await supabase.functions.invoke('admin-approve-user', {
    body: { userId },
  });
  if (error) throw error;
  return data;
}

/**
 * Delete a user (full auth + profile removal).
 */
export async function adminDeleteUser(userId) {
  if (!backendEnabled()) {
    const users = loadUsers();
    saveUsers(users.filter(u => u.id !== userId));
    return { success: true };
  }

  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { userId },
  });
  if (error) throw error;
  return data;
}
