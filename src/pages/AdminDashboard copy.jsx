// src/pages/AdminDashboard.jsx
//
// UPDATED: adds "Reset Password" and "Delete" actions per user.
// Adds a confirmation-based flow with success/error feedback.
// Uses the new adminOps.js module which routes through Edge Functions.
//
// Replaces the existing file at src/pages/AdminDashboard.jsx

import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getStyles } from '../utils/styles';
import {
  fetchPendingUsers,
  fetchAllUsers,
  updateProfileStatus,
  fetchNotifications,
  markNotificationAsRead,
} from '../utils/db';
import {
  adminResetUserPassword,
  adminApproveUserSecure,
  adminCreateTeacherSecure,
  adminDeleteUser,
} from '../utils/adminOps';

export default function AdminDashboard({ user, logout, backendEnabled }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);

  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ username: '', email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [pending, all, notifs] = await Promise.all([
      fetchPendingUsers(),
      fetchAllUsers(),
      fetchNotifications(user.id),
    ]);
    setPendingUsers(pending);
    setAllUsers(all);
    setNotifications(notifs);
    setLoading(false);
  };

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4500);
  };

  const handleApprove = async (userId) => {
    try {
      if (backendEnabled) await adminApproveUserSecure(userId);
      else await updateProfileStatus(userId, 'active');
      await loadData();
      showToast('✓ User approved');
    } catch (e) {
      showToast('✗ ' + e.message, 'error');
    }
  };

  const handleReject = async (userId) => {
    try {
      await updateProfileStatus(userId, 'rejected');
      await loadData();
      showToast('User rejected');
    } catch (e) {
      showToast('✗ ' + e.message, 'error');
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.username || !newTeacher.password || !newTeacher.fullName) return;
    try {
      await adminCreateTeacherSecure({
        ...newTeacher,
        language: i18n.language,
      });
      setNewTeacher({ username: '', email: '', password: '', fullName: '' });
      setShowAddTeacher(false);
      await loadData();
      showToast('✓ Teacher added');
    } catch (e) {
      showToast('✗ ' + e.message, 'error');
    }
  };

  const handleResetPassword = async (u) => {
    if (!confirm(t('admin.resetPasswordConfirm'))) return;
    try {
      const result = await adminResetUserPassword(u.id);
      await loadData();
      if (result.tempPassword) {
        showToast(t('admin.resetPasswordSuccess') + result.tempPassword);
      } else {
        showToast('✓ Reset sent');
      }
    } catch (e) {
      showToast('✗ ' + e.message, 'error');
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(t('admin.deleteUserConfirm'))) return;
    try {
      await adminDeleteUser(u.id);
      await loadData();
      showToast('✓ ' + t('admin.deleteSuccess'));
    } catch (e) {
      showToast('✗ ' + e.message, 'error');
    }
  };

  const handleMarkRead = async (notifId) => {
    await markNotificationAsRead(notifId);
    loadData();
  };

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={s.dashboard}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: toast.kind === 'error' ? '#C0524A' : '#2E5339',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)', zIndex: 9999,
          maxWidth: '90vw', fontFamily: "'Tajawal', sans-serif", fontSize: 14,
        }}>
          {toast.msg}
        </div>
      )}

      <header style={s.header}>
        <h1 style={s.title}>{t('admin.dashboard')}</h1>
        <button onClick={logout} style={s.logoutBtn}>{t('common.logout')}</button>
      </header>

      <div style={s.content}>
        {/* Pending approvals */}
        <div style={s.section}>
          <h2>{t('admin.pendingApprovals')}</h2>
          {pendingUsers.length === 0 ? (
            <p>{t('admin.noPending')}</p>
          ) : (
            pendingUsers.map((u) => (
              <div key={u.id} style={s.userCard}>
                <div>
                  <strong>{u.full_name}</strong> ({u.username}) — {u.role}
                  <br />
                  <small>{u.email}</small>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleApprove(u.id)} style={s.approveBtn}>Approve</button>
                  <button onClick={() => handleReject(u.id)} style={s.rejectBtn}>Reject</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add teacher */}
        <div style={s.section}>
          <h2>{t('admin.addTeacher')}</h2>
          <button onClick={() => setShowAddTeacher(!showAddTeacher)} style={s.primaryBtn}>
            {showAddTeacher ? 'Cancel' : t('admin.addTeacher')}
          </button>
          {showAddTeacher && (
            <div style={s.form}>
              <input placeholder="Username" value={newTeacher.username}
                onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                style={s.input} />
              <input placeholder="Email" value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                style={s.input} />
              <input placeholder="Password" type="password" value={newTeacher.password}
                onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                style={s.input} />
              <input placeholder="Full Name" value={newTeacher.fullName}
                onChange={(e) => setNewTeacher({ ...newTeacher, fullName: e.target.value })}
                style={s.input} />
              <button onClick={handleAddTeacher} style={s.primaryBtn}>Add</button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={s.section}>
          <h2>{t('admin.notifications')}</h2>
          {notifications.filter((n) => !n.read).map((n) => (
            <div key={n.id} style={s.notifCard}>
              <div>
                <strong>{n.title}</strong>
                <p>{n.message}</p>
              </div>
              <button onClick={() => handleMarkRead(n.id)} style={s.secondaryBtn}>Mark Read</button>
            </div>
          ))}
        </div>

        {/* All users — NEW: reset + delete actions */}
        <div style={s.section}>
          <h2>{t('admin.allUsers')}</h2>
          {allUsers.map((u) => {
            const isSelf = u.id === user.id;
            const pending = u.must_reset_password;
            return (
              <div key={u.id} style={{ ...s.userCard, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{u.full_name}</strong> ({u.username}) — {u.role} — {u.status}
                    <br />
                    <small>{u.email}</small>
                    {pending && (
                      <span style={{
                        display: 'inline-block', marginLeft: 8,
                        padding: '2px 8px', borderRadius: 99,
                        background: '#F5EBD2', color: '#8A6A1F',
                        fontSize: 11, fontWeight: 700,
                      }}>
                        🔑 reset pending
                      </span>
                    )}
                  </div>
                </div>

                {!isSelf && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleResetPassword(u)}
                      style={{
                        flex: 1, minWidth: 140, padding: '8px 12px',
                        borderRadius: 8, border: '1.5px solid #C8A85A',
                        background: '#fff', color: '#8A6A1F',
                        fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        fontFamily: "'Tajawal', sans-serif",
                      }}
                    >
                      🔑 {t('admin.resetPassword')}
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      style={{
                        flex: 1, minWidth: 100, padding: '8px 12px',
                        borderRadius: 8, border: '1.5px solid #C0524A',
                        background: '#fff', color: '#C0524A',
                        fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        fontFamily: "'Tajawal', sans-serif",
                      }}
                    >
                      🗑️ {t('admin.deleteUser')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
