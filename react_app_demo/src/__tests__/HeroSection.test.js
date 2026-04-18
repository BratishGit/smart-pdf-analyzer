import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HeroSection from '../components/HeroSection';

const renderHero = () => render(<BrowserRouter><HeroSection /></BrowserRouter>);

describe('HeroSection', () => {
    test('renders the main heading', () => {
        renderHero();
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('renders "Build" keyword in the heading', () => {
        renderHero();
        expect(screen.getByText(/build/i)).toBeInTheDocument();
    });

    test('renders the Get Started CTA button', () => {
        renderHero();
        expect(screen.getByRole('link', { name: /get started free/i })).toBeInTheDocument();
    });

    test('renders the Learn More secondary button', () => {
        renderHero();
        expect(screen.getByRole('link', { name: /learn more/i })).toBeInTheDocument();
    });

    test('renders the hero PDFBrat v3 badge', () => {
        renderHero();
        expect(screen.getByText(/PDFBrat v3/i)).toBeInTheDocument();
    });

    test('renders the stats pills (Users, Components, Uptime)', () => {
        renderHero();
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Components')).toBeInTheDocument();
        expect(screen.getByText('Uptime')).toBeInTheDocument();
    });

    test('hero section landmark is labelled', () => {
        renderHero();
        expect(screen.getByRole('region', { name: /hero section/i })).toBeInTheDocument();
    });
});
