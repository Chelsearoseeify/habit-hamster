import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RoutineForm } from '@/components/routines/RoutineForm'
import { DayView } from '@/components/views/DayView'
import { WeekView } from '@/components/views/WeekView'
import { MonthView } from '@/components/views/MonthView'
import { YearView } from '@/components/views/YearView'
import { RoutinesView } from '@/components/views/RoutinesView'
import { LevelCard } from '@/components/gamification/LevelCard'
import { AchievementsPanel } from '@/components/gamification/AchievementsPanel'
import { NotificationSettings } from '@/components/notifications/NotificationSettings'
import { useRoutines } from '@/hooks/useRoutines'
import { useCompletions } from '@/hooks/useCompletions'
import { useStats } from '@/hooks/useStats'
import { useGamification } from '@/hooks/useGamification'
import { getToday } from '@/lib/date-utils'
import { scheduleNotifications, areNotificationsEnabled } from '@/lib/notifications'
import type { ViewType } from '@/types'
import { Flame, Target, Trophy, X, List } from 'lucide-react'

function App() {
  const [view, setView] = useState<ViewType>('day')
  const [selectedDate, setSelectedDate] = useState(getToday())
  const [notificationsEnabled, setNotificationsEnabled] = useState(areNotificationsEnabled)

  const { routines, addRoutine, updateRoutine, deleteRoutine, getRoutinesByCategory } = useRoutines()
  const { completions, toggleCompletion } = useCompletions()
  const { todayStats, streak } = useStats(routines, completions)

  const {
    state: gamification,
    newAchievement,
    levelUp,
    dismissAchievement,
    dismissLevelUp,
    onCompletionToggled,
  } = useGamification(completions, routines, streak, todayStats.percentage)

  const handleToggle = (routineId: string, maxCount: number) => {
    const existing = completions.find(
      (c) => c.routineId === routineId && c.date === selectedDate
    )
    const currentCount = existing?.count ?? 0
    const wasCompleted = currentCount < maxCount
    toggleCompletion(routineId, selectedDate, maxCount)
    onCompletionToggled(wasCompleted)
  }

  const handleCellClick = (_routineId: string, date: string) => {
    setSelectedDate(date)
    setView('day')
  }

  const routinesByCategory = getRoutinesByCategory()

  // Schedule notifications whenever routines or completion state changes
  const reschedule = useCallback(() => {
    if (notificationsEnabled) {
      scheduleNotifications(routines, todayStats.total, todayStats.completed)
    }
  }, [notificationsEnabled, routines, todayStats.total, todayStats.completed])

  useEffect(() => { reschedule() }, [reschedule])

  // Auto-dismiss celebrations after 4 seconds
  useEffect(() => {
    if (newAchievement) {
      const t = setTimeout(dismissAchievement, 4000)
      return () => clearTimeout(t)
    }
  }, [newAchievement, dismissAchievement])

  useEffect(() => {
    if (levelUp) {
      const t = setTimeout(dismissLevelUp, 4000)
      return () => clearTimeout(t)
    }
  }, [levelUp, dismissLevelUp])

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Level-up banner */}
        {levelUp && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-5 py-3 shadow-lg backdrop-blur-sm">
            <span className="text-xl">🎉</span>
            <div>
              <p className="font-semibold text-sm">Level Up!</p>
              <p className="text-xs text-muted-foreground">You reached level {gamification.level}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={dismissLevelUp}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Achievement unlocked banner */}
        {newAchievement && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-yellow-400/40 bg-yellow-50 dark:bg-yellow-900/20 px-5 py-3 shadow-lg backdrop-blur-sm">
            <span className="text-xl">🏆</span>
            <div>
              <p className="font-semibold text-sm">{newAchievement.name}</p>
              <p className="text-xs text-muted-foreground">{newAchievement.description}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={dismissAchievement}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Habit Hamster</h1>
            <p className="text-sm text-muted-foreground">Track your daily routines</p>
          </div>
          <div className="flex items-center gap-1">
            <NotificationSettings onEnabledChange={(enabled) => {
              setNotificationsEnabled(enabled)
              if (enabled) scheduleNotifications(routines, todayStats.total, todayStats.completed)
            }} />
            <RoutineForm onSubmit={addRoutine} />
          </div>
        </header>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.percentage}%</div>
              <p className="text-xs text-muted-foreground">
                {todayStats.completed}/{todayStats.total} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{streak}</div>
              <p className="text-xs text-muted-foreground">days</p>
            </CardContent>
          </Card>

          <LevelCard level={gamification.level} xp={gamification.xp} />
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
            <TabsTrigger value="routines" className="flex items-center justify-center gap-1">
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">All</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center justify-center gap-1">
              <Trophy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">XP</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <DayView
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  routinesByCategory={routinesByCategory}
                  completions={completions}
                  onToggle={handleToggle}
                  onDelete={deleteRoutine}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="week" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <WeekView
                  routines={routines}
                  completions={completions}
                  onCellClick={handleCellClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <MonthView
                  routines={routines}
                  completions={completions}
                  onCellClick={handleCellClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="year" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <YearView
                  routines={routines}
                  completions={completions}
                  onCellClick={handleCellClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routines" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <RoutinesView
                  routines={routines}
                  completions={completions}
                  onDelete={deleteRoutine}
                  onEdit={(data, id) => updateRoutine(id, data)}
                  onPause={(id, paused) => updateRoutine(id, { paused })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-1">Level {gamification.level}</h3>
                    <p className="text-sm text-muted-foreground">
                      {gamification.xp} XP total · {gamification.achievements.length} / 9 achievements unlocked
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Achievements</h3>
                    <AchievementsPanel unlockedAchievements={gamification.achievements} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
