import '@testing-library/jest-dom/vitest'
import { createElement, type ReactNode } from 'react'
import { vi } from 'vitest'

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) =>
      createElement('div', { style: { width: 960, height: 320 } }, children),
  }
})
