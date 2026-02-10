import { uid } from './storage';

/**
 * Notification Service
 * Handles in-app notifications and WhatsApp message integration
 */

// Store notifications in localStorage (will be replaced with Supabase in production)
const NOTIFICATIONS_KEY = 'quran-tracker-notifications';

export function loadNotifications(userId) {
  try {
    const data = localStorage.getItem(`${NOTIFICATIONS_KEY}-${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveNotifications(userId, notifications) {
  try {
    localStorage.setItem(`${NOTIFICATIONS_KEY}-${userId}`, JSON.stringify(notifications));
  } catch (e) {
    console.error('Notification storage error:', e);
  }
}

/**
 * Create a notification for a user
 */
export function createNotification(userId, type, title, message, relatedId = null, whatsappStatus = null) {
  const notifications = loadNotifications(userId);

  const notification = {
    id: uid(),
    user_id: userId,
    type,
    title,
    message,
    related_id: relatedId,
    read: false,
    sent_whatsapp: false,
    whatsapp_status: whatsappStatus,
    whatsapp_error: null,
    created_at: new Date().toISOString(),
  };

  notifications.push(notification);
  saveNotifications(userId, notifications);

  return notification;
}

/**
 * Update notification WhatsApp status
 */
export function updateNotificationWhatsAppStatus(userId, notificationId, status, error = null) {
  const notifications = loadNotifications(userId);
  const updated = notifications.map(n =>
    n.id === notificationId ? {
      ...n,
      sent_whatsapp: status === 'delivered' || status === 'sent',
      whatsapp_status: status,
      whatsapp_error: error,
    } : n
  );
  saveNotifications(userId, updated);
}

/**
 * Retry sending WhatsApp for a notification
 */
export async function retryWhatsAppNotification(userId, notificationId) {
  const notifications = loadNotifications(userId);
  const notification = notifications.find(n => n.id === notificationId);

  if (!notification) return { success: false, error: 'Notification not found' };

  // Get user data to retrieve WhatsApp number
  const users = JSON.parse(localStorage.getItem('quran-tracker-users') || '[]');
  const user = users.find(u => u.id === userId);

  if (!user || !user.whatsapp_number) {
    return { success: false, error: 'WhatsApp number not found' };
  }

  // Try to send again
  updateNotificationWhatsAppStatus(userId, notificationId, 'sending');

  const result = await sendWhatsAppNotification(user.whatsapp_number, notification.message);

  if (result.success) {
    updateNotificationWhatsAppStatus(userId, notificationId, 'delivered');
  } else {
    updateNotificationWhatsAppStatus(userId, notificationId, 'failed', result.error);
  }

  return result;
}

/**
 * Mark a notification as read
 */
export function markNotificationAsRead(userId, notificationId) {
  const notifications = loadNotifications(userId);
  const updated = notifications.map(n =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  saveNotifications(userId, updated);
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(userId) {
  const notifications = loadNotifications(userId);
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(userId, updated);
}

/**
 * Delete a notification
 */
export function deleteNotification(userId, notificationId) {
  const notifications = loadNotifications(userId);
  const filtered = notifications.filter(n => n.id !== notificationId);
  saveNotifications(userId, filtered);
}

/**
 * Get unread notification count
 */
export function getUnreadCount(userId) {
  const notifications = loadNotifications(userId);
  return notifications.filter(n => !n.read).length;
}

/**
 * Send WhatsApp notification
 *
 * IMPORTANT: This requires WhatsApp Business API or Twilio setup
 *
 * Setup Instructions:
 *
 * Option 1: Twilio WhatsApp (Recommended for production)
 * 1. Sign up at https://www.twilio.com/
 * 2. Enable WhatsApp in Twilio Console
 * 3. Get your Account SID and Auth Token
 * 4. Add to .env file:
 *    VITE_TWILIO_ACCOUNT_SID=your_account_sid
 *    VITE_TWILIO_AUTH_TOKEN=your_auth_token
 *    VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
 *
 * Option 2: WhatsApp Business API
 * 1. Apply for WhatsApp Business API access
 * 2. Get API credentials
 * 3. Configure webhook and credentials
 *
 * For development/testing, this function logs the message to console.
 */
export async function sendWhatsAppNotification(phoneNumber, message) {
  console.log('📱 WhatsApp Notification:', {
    to: phoneNumber,
    message: message,
    timestamp: new Date().toISOString(),
  });

  // Check if Twilio credentials are configured
  const twilioAccountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  const twilioAuthToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
  const twilioWhatsAppNumber = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER;

  if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
    console.warn('⚠️ WhatsApp not configured. Add Twilio credentials to .env file.');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    // Twilio WhatsApp API call
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioWhatsAppNumber,
        To: `whatsapp:${phoneNumber}`,
        Body: message,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ WhatsApp message sent:', data.sid);
      return { success: true, messageId: data.sid };
    } else {
      const error = await response.json();
      console.error('❌ WhatsApp send failed:', error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error('❌ WhatsApp API error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify student about new review assignment
 */
export async function notifyReviewAssigned(student, review, includeWhatsApp = true) {
  const title = `مراجعة رقم ${review.review_number}`;
  const message = `تم تعيين مراجعة جديدة لك في ${new Date(review.review_date).toLocaleDateString('ar-SA')}. تتضمن ${review.surahs.length} سورة.`;

  // Create in-app notification
  const notification = createNotification(
    student.id,
    'review_assigned',
    title,
    message,
    review.id
  );

  // Send WhatsApp if enabled and number is available
  if (includeWhatsApp && student.whatsapp_number) {
    const whatsappMessage = `
🕌 ${title}

${student.fullName}، السلام عليكم ورحمة الله

تم تعيين مراجعة قرآنية جديدة لك:

📅 التاريخ: ${new Date(review.review_date).toLocaleDateString('ar-SA', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}

📚 السور المطلوبة (${review.surahs.length}):
${review.surahs.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${review.notes ? `\n📝 ملاحظات المعلم:\n${review.notes}` : ''}

بالتوفيق! 🌟
    `.trim();

    const result = await sendWhatsAppNotification(student.whatsapp_number, whatsappMessage);

    if (result.success) {
      // Update notification to mark WhatsApp as delivered
      updateNotificationWhatsAppStatus(student.id, notification.id, 'delivered');
    } else {
      // Mark as failed with error message
      updateNotificationWhatsAppStatus(student.id, notification.id, 'failed', result.error);
    }

    return { notification, whatsappResult: result };
  } else if (includeWhatsApp && !student.whatsapp_number) {
    // WhatsApp requested but no number available
    updateNotificationWhatsAppStatus(student.id, notification.id, 'no_number');
  }

  return notification;
}

/**
 * Send review reminder (for reviews due soon)
 */
export async function sendReviewReminder(student, review) {
  const daysUntil = Math.ceil((new Date(review.review_date) - new Date()) / (1000 * 60 * 60 * 24));

  const title = `تذكير: مراجعة رقم ${review.review_number}`;
  const message = `مراجعتك القرآنية خلال ${daysUntil} يوم. لا تنسَ المراجعة!`;

  createNotification(student.id, 'review_reminder', title, message, review.id);

  if (student.whatsapp_number) {
    const whatsappMessage = `
🔔 تذكير: مراجعة قرآنية

${student.fullName}، السلام عليكم

لديك مراجعة قرآنية قادمة خلال ${daysUntil} ${daysUntil === 1 ? 'يوم' : 'أيام'}

📝 مراجعة رقم ${review.review_number}
📅 ${new Date(review.review_date).toLocaleDateString('ar-SA')}
📚 ${review.surahs.length} سورة

استعد جيداً! 💪
    `.trim();

    await sendWhatsAppNotification(student.whatsapp_number, whatsappMessage);
  }
}

/**
 * Format notification for display
 */
export function formatNotificationTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;

  return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}
