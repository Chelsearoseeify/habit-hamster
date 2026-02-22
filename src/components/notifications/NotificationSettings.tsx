import { useState } from 'react'
import { Bell, BellOff, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  areNotificationsEnabled,
  requestNotificationPermission,
  setNotificationsEnabled,
} from '@/lib/notifications'

interface NotificationSettingsProps {
  onEnabledChange: (enabled: boolean) => void
}

export function NotificationSettings({ onEnabledChange }: NotificationSettingsProps) {
  const [open, setOpen] = useState(false)
  const [enabled, setEnabled] = useState(() => areNotificationsEnabled())
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )

  const handleToggle = async () => {
    if (!enabled) {
      if (permissionState !== 'granted') {
        const granted = await requestNotificationPermission()
        setPermissionState(granted ? 'granted' : 'denied')
        if (!granted) return
      }
      setNotificationsEnabled(true)
      setEnabled(true)
      onEnabledChange(true)
    } else {
      setNotificationsEnabled(false)
      setEnabled(false)
      onEnabledChange(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notification settings"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-10 z-40 w-64 rounded-xl border bg-card p-4 shadow-lg space-y-3">
          <p className="text-sm font-semibold">Notifications</p>

          {permissionState === 'denied' ? (
            <p className="text-xs text-muted-foreground">
              Notifications are blocked by your browser. Enable them in browser settings to use reminders.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Get reminders when routines are due and alerts when your streak is at risk.
              </p>
              <Button
                variant={enabled ? 'default' : 'outline'}
                size="sm"
                className="w-full gap-2"
                onClick={handleToggle}
              >
                {enabled ? (
                  <><Bell className="h-3.5 w-3.5" /> Reminders on</>
                ) : (
                  <><BellOff className="h-3.5 w-3.5" /> Enable reminders</>
                )}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      )}
    </div>
  )
}
