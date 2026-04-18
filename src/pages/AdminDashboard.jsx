import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getStyles } from '../utils/styles';
import {
  fetchPendingUsers,
  fetchAllUsers,
  updateProfileStatus,
  addTeacher,
  fetchNotifications,
  markNotificationAsRead,
} from '../utils/db';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const pending = await fetchPendingUsers();
    const all = await fetchAllUsers();
    const notifs = await fetchNotifications(user.id);
    setPendingUsers(pending);
    setAllUsers(all);
    setNotifications(notifs);
    setLoading(false);
  };

  const handleApprove = async (userId) => {
    await updateProfileStatus(userId, 'active');
    loadData();
  };

  const handleReject = async (userId) => {
    await updateProfileStatus(userId, 'rejected');
    loadData();
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.username || !newTeacher.password || !newTeacher.fullName) return;
    await addTeacher(newTeacher);
    setNewTeacher({ username: '', email: '', password: '', fullName: '' });
    setShowAddTeacher(false);
    loadData();
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
      <header style={s.header}>
        <h1 style={s.title}>{t('admin.dashboard')}</h1>
        <button onClick={logout} style={s.logoutBtn}>{t('common.logout')}</button>
      </header>

      <div style={s.content}>
        <div style={s.section}>
          <h2>{t('admin.pendingApprovals')}</h2>
          {pendingUsers.length === 0 ? (
            <p>{t('admin.noPending')}</p>
          ) : (
            pendingUsers.map(u => (
              <div key={u.id} style={s.userCard}>
                <div>
                  <strong>{u.full_name}</strong> ({u.username}) - {u.role}
                  <br />
                  <small>{u.email}</small>
                </div>
                <div>
                  <button onClick={() => handleApprove(u.id)} style={s.approveBtn}>Approve</button>
                  <button onClick={() => handleReject(u.id)} style={s.rejectBtn}>Reject</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={s.section}>
          <h2>{t('admin.addTeacher')}</h2>
          <button onClick={() => setShowAddTeacher(!showAddTeacher)} style={s.primaryBtn}>
            {showAddTeacher ? 'Cancel' : 'Add Teacher'}
          </button>
          {showAddTeacher && (
            <div style={s.form}>
              <input
                placeholder="Username"
                value={newTeacher.username}
                onChange={e => setNewTeacher({ ...newTeacher, username: e.target.value })}
                style={s.input}
              />
              <input
                placeholder="Email"
                value={newTeacher.email}
                onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                style={s.input}
              />
              <input
                placeholder="Password"
                type="password"
                value={newTeacher.password}
                onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })}
                style={s.input}
              />
              <input
                placeholder="Full Name"
                value={newTeacher.fullName}
                onChange={e => setNewTeacher({ ...newTeacher, fullName: e.target.value })}
                style={s.input}
              />
              <button onClick={handleAddTeacher} style={s.primaryBtn}>Add</button>
            </div>
          )}
        </div>

        <div style={s.section}>
          <h2>{t('admin.notifications')}</h2>
          {notifications.filter(n => !n.read).map(n => (
            <div key={n.id} style={s.notifCard}>
              <div>
                <strong>{n.title}</strong>
                <p>{n.message}</p>
              </div>
              <button onClick={() => handleMarkRead(n.id)} style={s.secondaryBtn}>Mark Read</button>
            </div>
          ))}
        </div>

        <div style={s.section}>
          <h2>{t('admin.allUsers')}</h2>
          {allUsers.map(u => (
            <div key={u.id} style={s.userCard}>
              <div>
                <strong>{u.full_name}</strong> ({u.username}) - {u.role} - {u.status}
                <br />
                <small>{u.email}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}