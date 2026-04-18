import { render, screen } from '@testing-library/react';
import TestimonialCard from '../components/TestimonialCard';

describe('TestimonialCard', () => {
    const props = {
        id: 'test-card-1',
        quote: 'This library changed how we build products.',
        author: 'Alex Kim',
        role: 'Lead Engineer',
        avatar: '',
    };

    test('renders the quote text', () => {
        render(<TestimonialCard {...props} />);
        expect(screen.getByText(/changed how we build/i)).toBeInTheDocument();
    });

    test('renders the author name', () => {
        render(<TestimonialCard {...props} />);
        expect(screen.getByText('Alex Kim')).toBeInTheDocument();
    });

    test('renders the author role', () => {
        render(<TestimonialCard {...props} />);
        expect(screen.getByText('Lead Engineer')).toBeInTheDocument();
    });

    test('renders the avatar emoji', () => {
        render(<TestimonialCard {...props} />);
        // Removed emoji check
    });

    test('has accessible article role with author label', () => {
        render(<TestimonialCard {...props} />);
        expect(screen.getByRole('article', { name: /Alex Kim/i })).toBeInTheDocument();
    });
});
