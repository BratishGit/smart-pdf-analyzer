import { render, screen } from '@testing-library/react';
import NewsFeed from '../components/NewsFeed';

describe('NewsFeed', () => {
    test('renders the section heading', () => {
        render(<NewsFeed />);
        expect(screen.getByText('Latest Updates')).toBeInTheDocument();
    });

    test('renders 4 news items', () => {
        render(<NewsFeed />);
        const items = screen.getAllByRole('listitem');
        expect(items.length).toBe(4);
    });

    test('renders the first article title', () => {
        render(<NewsFeed />);
        expect(screen.getByText(/PDFBrat v3\.0 is here/i)).toBeInTheDocument();
    });

    test('renders category badges', () => {
        render(<NewsFeed />);
        expect(screen.getByText('Launch')).toBeInTheDocument();
        expect(screen.getByText('Guide')).toBeInTheDocument();
    });

    test('renders read time information', () => {
        render(<NewsFeed />);
        const readTimes = screen.getAllByText(/min read/i);
        expect(readTimes.length).toBeGreaterThan(0);
    });

    test('has accessible section label', () => {
        render(<NewsFeed />);
        expect(screen.getByRole('region', { name: /latest news/i })).toBeInTheDocument();
    });
});
