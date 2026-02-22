import type { Routine } from "@/types";

const NOTIFICATIONS_ENABLED_KEY = "habit-hamster-notifications-enabled";

export function areNotificationsEnabled(): boolean {
  return (
    localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === "true" &&
    Notification.permission === "granted"
  );
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  const granted = permission === "granted";
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, granted ? "true" : "false");
  return granted;
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? "true" : "false");
}

/**
 * Posts scheduled notification messages to the service worker.
 * Each routine with a timeRange.start gets a reminder at that time.
 * Also schedules a "streak at risk" check at 20:00.
 */
export function scheduleNotifications(routines: Routine[], totalDue: number, completed: number): void {
  if (!areNotificationsEnabled()) return;
  if (!navigator.serviceWorker?.controller) return;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const schedules: { title: string; body: string; fireAt: number }[] = [];

  // Routine reminders
  for (const routine of routines) {
    if (!routine.timeRange?.start) continue;
    const [h, m] = routine.timeRange.start.split(":").map(Number);
    const fireTime = new Date(todayStr + "T00:00:00");
    fireTime.setHours(h, m, 0, 0);
    // Only schedule if the time is still in the future today
    if (fireTime.getTime() > now.getTime()) {
      schedules.push({
        title: "Habit Hamster",
        body: `Time for: ${routine.name}`,
        fireAt: fireTime.getTime(),
      });
    }
  }

  // Streak at risk — 20:00 if not all completed
  if (completed < totalDue) {
    const streakCheck = new Date(todayStr + "T20:00:00");
    if (streakCheck.getTime() > now.getTime()) {
      const remaining = totalDue - completed;
      schedules.push({
        title: "Habit Hamster 🐹",
        body: `You still have ${remaining} routine${remaining !== 1 ? "s" : ""} to complete today!`,
        fireAt: streakCheck.getTime(),
      });
    }
  }

  navigator.serviceWorker.controller.postMessage({
    type: "SCHEDULE_NOTIFICATIONS",
    schedules,
  });
}
