import { render, screen } from '@testing-library/react';
import TeamSection from '../components/TeamSection';

describe('TeamSection', () => {
    test('renders the section heading', () => {
        render(<TeamSection />);
        expect(screen.getByRole('heading', { name: /behind PDFBrat/i })).toBeInTheDocument();
    });

    test('renders 4 team member cards', () => {
        render(<TeamSection />);
        const articles = screen.getAllByRole('article');
        expect(articles.length).toBe(4);
    });

    test('renders Aria Nakamura team member', () => {
        render(<TeamSection />);
        expect(screen.getByText('Aria Nakamura')).toBeInTheDocument();
    });

    test('renders Ethan Rivera team member', () => {
        render(<TeamSection />);
        expect(screen.getByText('Ethan Rivera')).toBeInTheDocument();
    });

    test('renders team member roles', () => {
        render(<TeamSection />);
        expect(screen.getByText(/CEO & Co-founder/i)).toBeInTheDocument();
        expect(screen.getByText(/CTO & Co-founder/i)).toBeInTheDocument();
    });

    test('renders team member bios', () => {
        render(<TeamSection />);
        expect(screen.getByText(/google/i)).toBeInTheDocument();
    });

    test('renders "The Team" badge', () => {
        render(<TeamSection />);
        expect(screen.getByText('The Team')).toBeInTheDocument();
    });
});
