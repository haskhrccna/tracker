import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getStyles } from '../utils/styles';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
} from '../utils/db';
import { formatNotificationTime } from '../utils/notificationService';

export default function NotificationPanel({ userId, onClose, onReviewClick }) {
  const { dark } = useTheme();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const s = getStyles(dark, isRTL);

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    loadNotificationsData();
  }, [userId]);

  const loadNotificationsData = async () => {
    const data = await fetchNotifications(userId);
    setNotifications(data.reverse());
  };

  const handleMarkAsRead = async (notificationId) => {
    await markNotificationRead(userId, notificationId);
    loadNotificationsData();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsRead(userId);
    loadNotificationsData();
  };

  const handleDelete = async (notificationId) => {
    await removeNotification(userId, notificationId);
    loadNotificationsData();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.type === 'review_assigned' || notification.type === 'review_reminder') {
      if (onReviewClick) {
        onReviewClick(notification.related_id);
      }
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'review_assigned': return '📝';
      case 'review_reminder': return '🔔';
      case 'review_due': return '⏰';
      case 'achievement': return '🏆';
      default: return '📢';
    }
  };

  const styles = {
    overlay: s.modalOverlay,
    panel: {
      position: 'fixed',
      [isRTL ? 'right' : 'left']: 0,
      top: 0,
      bottom: 0,
      width: '100%',
      maxWidth: 450,
      background: dark ? '#0f172a' : '#fff',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      animation: `slideIn${isRTL ? 'Right' : 'Left'} 0.3s ease`,
    },
    header: {
      padding: '20px 24px',
      borderBottom: `2px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 700,
      color: dark ? '#f1f5f9' : '#1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    badge: {
      background: '#ef4444',
      color: '#fff',
      padding: '4px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
    },
    closeBtn: {
      background: 'transparent',
      border: 'none',
      fontSize: 24,
      color: dark ? '#94a3b8' : '#64748b',
      cursor: 'pointer',
      padding: 8,
    },
    controls: {
      padding: '12px 24px',
      borderBottom: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
      display: 'flex',
      gap: 8,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    filterBtn: (active) => ({
      padding: '8px 14px',
      borderRadius: 8,
      border: `1px solid ${active ? '#3b82f6' : (dark ? '#334155' : '#e2e8f0')}`,
      background: active ? '#3b82f6' : 'transparent',
      color: active ? '#fff' : (dark ? '#f1f5f9' : '#1e293b'),
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
    }),
    markAllBtn: {
      padding: '8px 14px',
      borderRadius: 8,
      border: 'none',
      background: dark ? '#1e40af' : '#dbeafe',
      color: dark ? '#93c5fd' : '#1e40af',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
    },
    list: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px 0',
    },
    notificationItem: (read) => ({
      padding: '16px 24px',
      borderBottom: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
      cursor: 'pointer',
      background: read ? 'transparent' : (dark ? '#1e293b40' : '#eff6ff'),
      transition: 'background 0.2s',
      position: 'relative',
    }),
    notificationContent: {
      display: 'flex',
      gap: 12,
      marginBottom: 8,
    },
    icon: {
      fontSize: 24,
      flexShrink: 0,
    },
    textContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: 600,
      color: dark ? '#f1f5f9' : '#1e293b',
      marginBottom: 4,
    },
    notificationMessage: {
      fontSize: 13,
      color: dark ? '#94a3b8' : '#64748b',
      lineHeight: 1.5,
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    time: {
      fontSize: 11,
      color: dark ? '#64748b' : '#94a3b8',
    },
    deleteBtn: {
      background: 'transparent',
      border: 'none',
      color: dark ? '#64748b' : '#94a3b8',
      cursor: 'pointer',
      padding: '4px 8px',
      fontSize: 12,
    },
    unreadDot: {
      position: 'absolute',
      [isRTL ? 'left' : 'right']: 24,
      top: 20,
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: '#3b82f6',
    },
    whatsappBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: '#25D366',
      color: '#fff',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 600,
      marginTop: 4,
    },
    emptyState: {
      textAlign: 'center',
      padding: 60,
      color: dark ? '#64748b' : '#94a3b8',
    },
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose}></div>
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div style={styles.title}>
            🔔 {isRTL ? 'الإشعارات' : i18n.language === 'fr' ? 'Notifications' : 'Notifications'}
            {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.controls}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFilter('all')}
              style={styles.filterBtn(filter === 'all')}
            >
              {isRTL ? 'الكل' : i18n.language === 'fr' ? 'Tous' : 'All'}
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={styles.filterBtn(filter === 'unread')}
            >
              {isRTL ? 'غير مقروء' : i18n.language === 'fr' ? 'Non lus' : 'Unread'} ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} style={styles.markAllBtn}>
              ✓ {isRTL ? 'قراءة الكل' : i18n.language === 'fr' ? 'Tout marquer' : 'Mark all read'}
            </button>
          )}
        </div>

        <div style={styles.list}>
          {filteredNotifications.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔕</div>
              <p>
                {filter === 'unread'
                  ? (isRTL ? 'لا توجد إشعارات غير مقروءة' : i18n.language === 'fr' ? 'Aucune notification non lue' : 'No unread notifications')
                  : (isRTL ? 'لا توجد إشعارات' : i18n.language === 'fr' ? 'Aucune notification' : 'No notifications')}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                style={styles.notificationItem(notification.read)}
                onClick={() => handleNotificationClick(notification)}
                onMouseOver={(e) => e.currentTarget.style.background = dark ? '#1e293b' : '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.background = notification.read ? 'transparent' : (dark ? '#1e293b40' : '#eff6ff')}
              >
                {!notification.read && <div style={styles.unreadDot}></div>}
                <div style={styles.notificationContent}>
                  <div style={styles.icon}>{getNotificationIcon(notification.type)}</div>
                  <div style={styles.textContent}>
                    <div style={styles.notificationTitle}>{notification.title}</div>
                    <div style={styles.notificationMessage}>{notification.message}</div>
                    {notification.sent_whatsapp && (
                      <div style={styles.whatsappBadge}>
                        ✓ WhatsApp
                      </div>
                    )}
                  </div>
                </div>
                <div style={styles.footer}>
                  <span style={styles.time}>{formatNotificationTime(notification.created_at)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    style={styles.deleteBtn}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
