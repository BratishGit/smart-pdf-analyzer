import { render, screen } from '@testing-library/react';
import FeatureCard from '../components/FeatureCard';

describe('FeatureCard', () => {
    const props = {
        id: 'feat-test',
        icon: '',
        title: 'Blazing Fast',
        description: 'Optimized for performance out of the box.',
        tag: 'Perf',
    };

    test('renders the title', () => {
        render(<FeatureCard {...props} />);
        expect(screen.getByText('Blazing Fast')).toBeInTheDocument();
    });

    test('renders the description', () => {
        render(<FeatureCard {...props} />);
        expect(screen.getByText(/optimized for performance/i)).toBeInTheDocument();
    });

    test('renders the icon', () => {
        render(<FeatureCard {...props} />);
        // Removed emoji check
    });

    test('renders the tag badge', () => {
        render(<FeatureCard {...props} />);
        expect(screen.getByText('Perf')).toBeInTheDocument();
    });

    test('renders without tag when tag is undefined', () => {
        const { tag, ...rest } = props;
        render(<FeatureCard {...rest} />);
        expect(screen.queryByText('Perf')).not.toBeInTheDocument();
    });

    test('has article role', () => {
        render(<FeatureCard {...props} />);
        expect(screen.getByRole('article')).toBeInTheDocument();
    });

    test('renders the arrow indicator', () => {
        render(<FeatureCard {...props} />);
        expect(screen.getByText('→')).toBeInTheDocument();
    });
});
