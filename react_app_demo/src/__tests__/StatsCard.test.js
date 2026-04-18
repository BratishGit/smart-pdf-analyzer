import { render, screen } from '@testing-library/react';
import StatsCard from '../components/StatsCard';

describe('StatsCard', () => {
    const defaultProps = {
        id: 'test-stat',
        icon: '📊',
        value: '42k',
        label: 'Downloads',
    };

    test('renders the value', () => {
        render(<StatsCard {...defaultProps} />);
        expect(screen.getByText('42k')).toBeInTheDocument();
    });

    test('renders the label', () => {
        render(<StatsCard {...defaultProps} />);
        expect(screen.getByText('Downloads')).toBeInTheDocument();
    });

    test('renders the icon', () => {
        render(<StatsCard {...defaultProps} />);
        expect(screen.getByText('📊')).toBeInTheDocument();
    });

    test('shows positive trend with up indicator', () => {
        render(<StatsCard {...defaultProps} trend={15} />);
        expect(screen.getByText(/15%/)).toBeInTheDocument();
    });

    test('shows negative trend with down indicator', () => {
        render(<StatsCard {...defaultProps} trend={-5} />);
        expect(screen.getByText(/5%/)).toBeInTheDocument();
    });

    test('does not show trend indicator when trend is not provided', () => {
        render(<StatsCard {...defaultProps} />);
        expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });

    test('has accessible article role with label', () => {
        render(<StatsCard {...defaultProps} />);
        expect(screen.getByRole('article', { name: /Downloads: 42k/i })).toBeInTheDocument();
    });
});
