import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoutineForm } from '@/components/routines/RoutineForm'
import { DayView } from '@/components/views/DayView'
import { WeekView } from '@/components/views/WeekView'
import { MonthView } from '@/components/views/MonthView'
import { YearView } from '@/components/views/YearView'
import { useRoutines } from '@/hooks/useRoutines'
import { useCompletions } from '@/hooks/useCompletions'
import { useStats } from '@/hooks/useStats'
import { getToday } from '@/lib/date-utils'
import type { ViewType } from '@/types'
import { Flame, Target, TrendingUp } from 'lucide-react'

function App() {
  const [view, setView] = useState<ViewType>('day')
  const [selectedDate, setSelectedDate] = useState(getToday())

  const { routines, addRoutine, deleteRoutine, getRoutinesByCategory } = useRoutines()
  const { completions, toggleCompletion } = useCompletions()
  const { todayStats, streak } = useStats(routines, completions)

  const handleToggle = (routineId: string, maxCount: number) => {
    toggleCompletion(routineId, selectedDate, maxCount)
  }

  const handleCellClick = (_routineId: string, date: string) => {
    setSelectedDate(date)
    setView('day')
  }

  const routinesByCategory = getRoutinesByCategory()

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Habit Hamster</h1>
            <p className="text-sm text-muted-foreground">Track your daily routines</p>
          </div>
          <RoutineForm onSubmit={addRoutine} />
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Routines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{routines.length}</div>
              <p className="text-xs text-muted-foreground">active</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  )
}

export default App
