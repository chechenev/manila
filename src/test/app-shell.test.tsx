import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRouter } from '../app/AppRouter.tsx'

describe('AppRouter', () => {
  it('renders the explorer route content', async () => {
    render(
      <MemoryRouter initialEntries={['/explorer']}>
        <AppRouter />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Refund Explorer' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Pending refund requests' }),
    ).toBeInTheDocument()
  })

  it('renders the analytics route content', async () => {
    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <AppRouter />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Analytics Dashboard' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Refund pressure is concentrated/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: /High-refund and high-risk customers/i,
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByLabelText(/Request date from/i),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Request date to/i)).toBeInTheDocument()
  })

  it('filters the queue and opens the selected refund modal', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/explorer']}>
        <AppRouter />
      </MemoryRouter>,
    )

    const queryField = await screen.findByLabelText(
      /Customer, order, or refund ID/i,
    )

    await user.clear(queryField)
    await user.type(queryField, 'CUS-00004')
    await user.click(screen.getByRole('button', { name: 'Apply Filters' }))
    await user.click(
      screen.getAllByRole('button', { name: /Review details for/i })[0],
    )

    expect(
      screen.getByRole('heading', { name: /Joaquin Aquino/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Risk flags and explanations/i)).toBeInTheDocument()
  })

  it('hydrates filters and page state from the URL', async () => {
    render(
      <MemoryRouter initialEntries={['/explorer?paymentMethod=gcash&page=2']}>
        <AppRouter />
      </MemoryRouter>,
    )

    expect(await screen.findByLabelText(/Payment method/i)).toHaveValue('gcash')
    expect(
      screen.getByRole('button', { current: 'page', name: '2' }),
    ).toBeInTheDocument()
  })

  it('opens batch review and allows excluding flagged items', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/explorer']}>
        <AppRouter />
      </MemoryRouter>,
    )

    await user.click(
      await screen.findByRole('button', {
        name: /Add RF-00016 to batch selection/i,
      }),
    )
    await user.click(
      screen.getByRole('button', {
        name: /Add RF-00015 to batch selection/i,
      }),
    )
    await user.click(screen.getByRole('button', { name: /Open Bulk Review/i }))

    expect(
      screen.getByRole('heading', {
        name: /Preflight the selected refund batch/i,
      }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Exclude flagged items/i }),
    )

    expect(screen.getByText(/Excluded items/i)).toBeInTheDocument()
  })

  it('allows flagging a blocked batch from the preflight review', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/explorer']}>
        <AppRouter />
      </MemoryRouter>,
    )

    await user.click(
      screen.getByRole('button', {
        name: /Add RF-00016 to batch selection/i,
      }),
    )
    await user.click(screen.getByRole('button', { name: /Open Bulk Review/i }))
    await user.click(
      screen.getByRole('button', { name: /Flag included batch/i }),
    )

    expect(
      screen.queryByRole('heading', {
        name: /Preflight the selected refund batch/i,
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: /Add RF-00016 to batch selection/i,
      }),
    ).not.toBeInTheDocument()
  })

  it('clears exclusion state when a refund is removed from batch selection', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/explorer']}>
        <AppRouter />
      </MemoryRouter>,
    )

    await user.click(
      screen.getByRole('button', {
        name: /Add RF-00016 to batch selection/i,
      }),
    )
    await user.click(screen.getByRole('button', { name: /Open Bulk Review/i }))
    await user.click(screen.getByRole('button', { name: /^Exclude$/i }))
    expect(screen.getByText(/Excluded items/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Close review/i }))
    await user.click(
      screen.getByRole('button', {
        name: /Remove RF-00016 from batch selection/i,
      }),
    )
    await user.click(
      screen.getByRole('button', {
        name: /Add RF-00016 to batch selection/i,
      }),
    )
    await user.click(screen.getByRole('button', { name: /Open Bulk Review/i }))

    expect(screen.queryByText(/Excluded items/i)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/No blocking items remain in the included set./i),
    ).not.toBeInTheDocument()
  })
})
