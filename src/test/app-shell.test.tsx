import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    expect(
      screen.getByRole('heading', { name: 'Pending refund requests' }),
    ).toBeInTheDocument()
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

  it('filters the queue and updates the selected detail panel', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/explorer']}>
        <AppRouter />
      </MemoryRouter>,
    )

    await user.clear(screen.getByLabelText(/Customer, order, or refund ID/i))
    await user.type(
      screen.getByLabelText(/Customer, order, or refund ID/i),
      'CUS-00004',
    )
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))

    expect(
      screen.getByRole('heading', { name: /Joaquin Aquino/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Risk flags and explanations/i)).toBeInTheDocument()
  })

  it('hydrates filters and page state from the URL', () => {
    render(
      <MemoryRouter initialEntries={['/explorer?paymentMethod=gcash&page=2']}>
        <AppRouter />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/Payment method/i)).toHaveValue('gcash')
    expect(screen.getByText(/page 2 of/i)).toBeInTheDocument()
  })
})
