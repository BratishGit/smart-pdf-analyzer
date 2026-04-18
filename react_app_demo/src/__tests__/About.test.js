import { render, screen } from '@testing-library/react';
import About from '../pages/About';

const renderAbout = () => render(<About />);

describe('About Page', () => {
    test('renders the main element', () => {
        renderAbout();
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('renders the hero heading', () => {
        renderAbout();
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('contains MissionStatement component content', () => {
        renderAbout();
        expect(screen.getByText(/our mission/i)).toBeInTheDocument();
    });

    test('contains TeamSection with team member cards', () => {
        renderAbout();
        expect(screen.getByText('Aria Nakamura')).toBeInTheDocument();
    });

    test('contains Timeline component', () => {
        renderAbout();
        expect(screen.getByText(/our journey/i)).toBeInTheDocument();
        expect(screen.getByText('2021')).toBeInTheDocument();
    });

    test('contains FAQ component', () => {
        renderAbout();
        expect(screen.getByText(/is PDFBrat free to use/i)).toBeInTheDocument();
    });

    test('renders at least 4 section headings (one per component)', () => {
        renderAbout();
        const headings = screen.getAllByRole('heading', { level: 2 });
        expect(headings.length).toBeGreaterThanOrEqual(4);
    });

    test('has #about-page id', () => {
        renderAbout();
        expect(document.getElementById('about-page')).toBeInTheDocument();
    });
});
