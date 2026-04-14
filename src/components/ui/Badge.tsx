import type { ReactNode } from 'react'

type BadgeTone = 'default' | 'success' | 'warning' | 'critical'

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
}

export function Badge({ children, tone = 'default' }: BadgeProps) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>
}
