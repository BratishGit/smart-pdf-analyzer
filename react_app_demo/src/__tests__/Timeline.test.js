import { render, screen } from '@testing-library/react';
import Timeline from '../components/Timeline';

describe('Timeline', () => {
    test('renders the section heading', () => {
        render(<Timeline />);
        expect(screen.getByRole('heading', { name: /how we got/i })).toBeInTheDocument();
    });

    test('renders 6 milestone items', () => {
        render(<Timeline />);
        const items = screen.getAllByRole('listitem');
        expect(items.length).toBe(6);
    });

    test('renders the first milestone year 2021', () => {
        render(<Timeline />);
        expect(screen.getByText('2021')).toBeInTheDocument();
    });

    test('renders the latest milestone year 2026', () => {
        render(<Timeline />);
        expect(screen.getByText('2026')).toBeInTheDocument();
    });

    test('renders milestone event text for the founding', () => {
        render(<Timeline />);
        expect(screen.getByText(/founded in a tiny apartment/i)).toBeInTheDocument();
    });

    test('renders "Our Journey" badge', () => {
        render(<Timeline />);
        expect(screen.getByText(/our journey/i)).toBeInTheDocument();
    });

    test('has an accessible ordered list', () => {
        render(<Timeline />);
        expect(screen.getByRole('list', { name: /milestones/i })).toBeInTheDocument();
    });
});
