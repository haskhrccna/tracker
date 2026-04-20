import { createNotification, updateReview as updateDbReview } from './db';
import { supabase } from '../lib/supabase';

/**
 * Send WhatsApp notification via Edge Function
 */
export async function sendWhatsAppNotification(phoneNumber, message) {
  console.log('📱 WhatsApp Notification:', {
    to: phoneNumber,
    message: message,
    timestamp: new Date().toISOString(),
  });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'Not authenticated' };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: `whatsapp:${phoneNumber}`, message }),
    });

    const data = await response.json();
    if (response.ok && data.data?.sid) {
      console.log('✅ WhatsApp message sent:', data.data.sid);
      return { success: true, messageId: data.data.sid };
    } else {
      console.warn('⚠️ WhatsApp not sent:', data.error || 'Unknown error');
      return { success: false, error: data.error || 'WhatsApp not configured' };
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
  const studentName = student.fullName || student.full_name || '';
  const title = `مراجعة رقم ${review.review_number}`;
  const message = `تم تعيين مراجعة جديدة لك في ${new Date(review.review_date).toLocaleDateString('ar-SA')}. تتضمن ${review.surahs.length} سورة.`;

  // Create in-app notification via Supabase
  const { data: notification } = await createNotification(
    student.id,
    'review_assigned',
    title,
    message,
    review.id,
  );

  // Send WhatsApp if enabled and number is available
  if (includeWhatsApp && student.whatsapp_number) {
    const whatsappMessage = `
🕌 ${title}

${studentName}، السلام عليكم ورحمة الله

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

    return { notification, whatsappResult: result };
  }

  return { notification, whatsappResult: null };
}

/**
 * Send review reminder (for reviews due soon)
 */
export async function sendReviewReminder(student, review) {
  const daysUntil = Math.ceil((new Date(review.review_date) - new Date()) / (1000 * 60 * 60 * 24));

  const title = `تذكير: مراجعة رقم ${review.review_number}`;
  const message = `مراجعتك القرآنية خلال ${daysUntil} يوم. لا تنسَ المراجعة!`;

  await createNotification(student.id, 'review_reminder', title, message, review.id);

  if (student.whatsapp_number) {
    const studentName = student.fullName || student.full_name || '';
    const whatsappMessage = `
🔔 تذكير: مراجعة قرآنية

${studentName}، السلام عليكم

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
