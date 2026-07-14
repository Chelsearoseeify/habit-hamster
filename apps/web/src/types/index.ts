export * from '@habit-hamster/types'

export type ViewType = 'now' | 'day' | 'week' | 'month' | 'year' | 'rewards' | 'routines'

export const CATEGORIES = ['Fitness', 'Nutrition', 'Skincare', 'Supplements'] as const
export type Category = (typeof CATEGORIES)[number]
