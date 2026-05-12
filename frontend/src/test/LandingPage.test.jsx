import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import LandingPage from '../pages/LandingPage';

describe('LandingPage Smoke Test', () => {
    it('renders hero section with primary value proposition', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );
        
        // Check for key hero text
        expect(screen.getByText(/Turn/i)).toBeInTheDocument();
        expect(screen.getByText(/playlists into courses you can actually finish/i)).toBeInTheDocument();
    });

    it('renders CTA buttons', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );
        
        expect(screen.getByText(/Start Learning/i)).toBeInTheDocument();
        expect(screen.getByText(/Watch Demo/i)).toBeInTheDocument();
    });
});
