import { STORAGE_KEY } from './constants';

export function loadUsers() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) { console.error("Storage error:", e); }
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Activity heatmap data from localStorage
export function loadActivity(userId) {
  try {
    const data = localStorage.getItem(`quran-tracker-activity-${userId}`);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

export function saveActivity(userId, activityMap) {
  try {
    localStorage.setItem(`quran-tracker-activity-${userId}`, JSON.stringify(activityMap));
  } catch (e) { console.error("Activity storage error:", e); }
}

export function recordDailyActivity(userId) {
  const today = new Date().toISOString().split('T')[0];
  const activity = loadActivity(userId);
  activity[today] = (activity[today] || 0) + 1;
  saveActivity(userId, activity);
  return activity;
}

// Streak calculation
export function calculateStreak(activityMap) {
  const dates = Object.keys(activityMap).sort().reverse();
  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 0;
  let checkDate = new Date(dates[0]);

  for (const date of dates) {
    const d = new Date(date);
    const expected = new Date(checkDate);
    if (d.toISOString().split('T')[0] === expected.toISOString().split('T')[0]) {
      streak++;
      checkDate = new Date(expected.getTime() - 86400000);
    } else {
      break;
    }
  }
  return streak;
}
