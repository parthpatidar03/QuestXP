import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import { act } from 'react';
import LandingPage from '../pages/LandingPage';

describe('LandingPage Smoke Test', () => {
    it('renders hero section with primary value proposition', async () => {
        // Mock fetch for stats
        global.fetch = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ learners: 100, missions: 200, xp: 5000, visits: 1000 }),
            })
        );

        await act(async () => {
            render(
                <HelmetProvider>
                    <BrowserRouter>
                        <LandingPage />
                    </BrowserRouter>
                </HelmetProvider>
            );
        });
        
        // Check for key hero text using role to avoid collision with testimonials
        expect(screen.getByRole('heading', { name: /Turn/i, level: 1 })).toBeInTheDocument();
        expect(screen.getByText(/actually finish\./i)).toBeInTheDocument();
    });

    it('renders CTA buttons', async () => {
        await act(async () => {
            render(
                <HelmetProvider>
                    <BrowserRouter>
                        <LandingPage />
                    </BrowserRouter>
                </HelmetProvider>
            );
        });
        
        // Buttons in the hero section
        // We now have a 'Get Started' button in the hero form
        const getStartedButtons = screen.getAllByText(/Get Started/i);
        expect(getStartedButtons.length).toBeGreaterThan(0);
        // Buttons in the header
        expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Get Started/i).length).toBeGreaterThan(0);
    });
});
