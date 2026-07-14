export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

export function getToday(): string {
  return formatDate(new Date())
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getDaysInRange(start: Date, end: Date): string[] {
  const days: string[] = []
  const current = new Date(start)
  while (current <= end) {
    days.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function getYearStart(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1)
}

export function getDayOfWeek(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

export function getWeeksInYear(year: number): Date[][] {
  const weeks: Date[][] = []
  const start = new Date(year, 0, 1)
  const startDay = start.getDay()
  const firstSunday = new Date(year, 0, 1 - startDay)

  let current = new Date(firstSunday)

  while (current.getFullYear() <= year) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
    if (current.getFullYear() > year && current.getMonth() > 0) break
  }

  return weeks
}

export function formatMonthShort(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month]
}

export function formatDayShort(day: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[day]
}
