import { render, screen } from '@testing-library/react';
import MissionStatement from '../components/MissionStatement';

describe('MissionStatement', () => {
    test('renders "Our Mission" badge', () => {
        render(<MissionStatement />);
        expect(screen.getByText(/our mission/i)).toBeInTheDocument();
    });

    test('renders the mission heading', () => {
        render(<MissionStatement />);
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    test('renders "Empowering" text', () => {
        render(<MissionStatement />);
        expect(screen.getByText(/empowering developers/i)).toBeInTheDocument();
    });

    test('renders the Open Source value badge', () => {
        render(<MissionStatement />);
        expect(screen.getByText('Open Source')).toBeInTheDocument();
    });

    test('renders the Accessible badge', () => {
        render(<MissionStatement />);
        expect(screen.getByText('Accessible')).toBeInTheDocument();
    });

    test('renders all 4 value badges', () => {
        render(<MissionStatement />);
        ['Open Source', 'Accessible', 'Performant', 'Beautiful'].forEach(label => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    test('section has a labelled region', () => {
        render(<MissionStatement />);
        expect(screen.getByRole('region', { name: /our mission/i })).toBeInTheDocument();
    });
});
