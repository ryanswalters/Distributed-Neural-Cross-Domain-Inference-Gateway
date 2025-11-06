
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App'

describe('App', () => {
    it('renders the main heading', () => {
    render(<App />)
    expect(
        screen.getByText(/Distributed Neural Cross-Domain Inference Gateway/i)
    ).toBeDefined()
    })

    it('shows ISO certification badge', () => {
    render(<App />)
    expect(screen.getByText(/Gartner-Approved/i)).toBeDefined()
    })

    it('renders tabs navigation', () => {
    render(<App />)
    expect(screen.getByText(/Tools/i)).toBeDefined()
    expect(screen.getByText(/Workflows/i)).toBeDefined()
    expect(screen.getByText(/MCP Library/i)).toBeDefined()
    expect(screen.getByText(/Analytics/i)).toBeDefined()
    })
})
