import { useState } from 'react'
import { Bell, BellOff, Settings, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  areNotificationsEnabled,
  requestNotificationPermission,
  setNotificationsEnabled,
  subscribeToWebPush,
} from '@/lib/notifications'
import { clearHistory, clearAll } from '@/lib/api'

interface NotificationSettingsProps {
  onEnabledChange: (enabled: boolean) => void
}

export function NotificationSettings({ onEnabledChange }: NotificationSettingsProps) {
  const [open, setOpen] = useState(false)
  const [enabled, setEnabled] = useState(() => areNotificationsEnabled())
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )
  const [busy, setBusy] = useState(false)

  const runReset = async (label: string, fn: () => Promise<void>) => {
    if (
      !window.confirm(
        `${label}\n\nThis permanently erases data and cannot be undone. Continue?`
      )
    )
      return
    setBusy(true)
    try {
      await fn()
      window.location.reload()
    } catch {
      setBusy(false)
      window.alert('Something went wrong. Nothing may have been deleted — try again.')
    }
  }

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
      subscribeToWebPush().catch(console.error)
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

          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-semibold">Reset data</p>
            <p className="text-[11px] text-muted-foreground">
              History = completions, reflections and progress. "Everything" also removes all
              routines.
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              className="w-full gap-2 text-destructive hover:text-destructive"
              onClick={() =>
                runReset(
                  'Delete all history? Completions, reflections and progress will be erased. Your routines are kept.',
                  clearHistory
                )
              }
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete history
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              className="w-full gap-2 text-destructive hover:text-destructive"
              onClick={() =>
                runReset(
                  'Delete everything? All routines AND history will be erased.',
                  clearAll
                )
              }
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete everything
            </Button>
          </div>

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
