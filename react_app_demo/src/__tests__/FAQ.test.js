import { render, screen, fireEvent } from '@testing-library/react';
import FAQ from '../components/FAQ';

describe('FAQ', () => {
    test('renders the FAQ section heading', () => {
        render(<FAQ />);
        expect(screen.getByRole('heading', { name: /frequently asked/i })).toBeInTheDocument();
    });

    test('renders 5 FAQ questions', () => {
        render(<FAQ />);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(5);
    });

    test('all answers are initially hidden', () => {
        render(<FAQ />);
        const answers = document.querySelectorAll('[hidden]');
        expect(answers.length).toBe(5);
    });

    test('clicking a question reveals its answer', () => {
        render(<FAQ />);
        const firstButton = screen.getAllByRole('button')[0];
        fireEvent.click(firstButton);
        // After click, first answer should not be hidden
        const answers = document.querySelectorAll('[hidden]');
        expect(answers.length).toBe(4);
    });

    test('clicking open question again hides the answer', () => {
        render(<FAQ />);
        const firstButton = screen.getAllByRole('button')[0];
        fireEvent.click(firstButton);
        fireEvent.click(firstButton);
        const answers = document.querySelectorAll('[hidden]');
        expect(answers.length).toBe(5);
    });

    test('aria-expanded updates when question is opened', () => {
        render(<FAQ />);
        const btn = screen.getAllByRole('button')[0];
        expect(btn).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(btn);
        expect(btn).toHaveAttribute('aria-expanded', 'true');
    });

    test('renders the licence question text', () => {
        render(<FAQ />);
        expect(screen.getByText(/is PDFBrat free to use/i)).toBeInTheDocument();
    });
});
