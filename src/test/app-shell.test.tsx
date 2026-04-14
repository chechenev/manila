import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRouter } from '../app/AppRouter.tsx'

describe('AppRouter', () => {
  it('renders the explorer route content', () => {
    render(
      <MemoryRouter initialEntries={['/explorer']}>
        <AppRouter />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Refund Explorer' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Explorer skeleton/i)).toBeInTheDocument()
  })

  it('renders the analytics route content', () => {
    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <AppRouter />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Analytics Dashboard' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Analytics route is wired and ready/i),
    ).toBeInTheDocument()
  })
})
