import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';

const renderHome = () => render(<BrowserRouter><Home /></BrowserRouter>);

describe('Home Page', () => {
    test('renders the main element', () => {
        renderHome();
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('renders the hero heading', () => {
        renderHome();
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('renders the statistics section', () => {
        renderHome();
        expect(screen.getByLabelText(/key statistics/i)).toBeInTheDocument();
    });

    test('renders 4 StatsCard components', () => {
        renderHome();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('Components')).toBeInTheDocument();
        expect(screen.getByText('GitHub Stars')).toBeInTheDocument();
        expect(screen.getByText('Uptime SLA')).toBeInTheDocument();
    });

    test('renders the Features section', () => {
        renderHome();
        expect(screen.getByRole('heading', { name: /ship faster/i })).toBeInTheDocument();
    });

    test('renders 6 FeatureCard components', () => {
        renderHome();
        expect(screen.getByText('Design System')).toBeInTheDocument();
        expect(screen.getByText('Dark Mode First')).toBeInTheDocument();
        expect(screen.getByText('Accessible by Default')).toBeInTheDocument();
    });

    test('renders the NewsFeed component', () => {
        renderHome();
        expect(screen.getByText('Latest Updates')).toBeInTheDocument();
    });

    test('renders 3 testimonial cards', () => {
        renderHome();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
        expect(screen.getByText('Jake Thompson')).toBeInTheDocument();
        expect(screen.getByText('Lena Müller')).toBeInTheDocument();
    });

    test('has #main-content id for skip link target', () => {
        renderHome();
        expect(document.getElementById('main-content')).toBeInTheDocument();
    });
});
