import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Contact from '../pages/Contact';

const renderContact = () => render(<Contact />);

describe('Contact Page', () => {
    test('renders the "Let\'s talk" heading', () => {
        renderContact();
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('renders three InputField components (name, email, message)', () => {
        renderContact();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/your message/i)).toBeInTheDocument();
    });

    test('renders the Send Message button', () => {
        renderContact();
        expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    test('shows required field errors on empty submit', async () => {
        renderContact();
        fireEvent.click(screen.getByRole('button', { name: /send message/i }));
        await waitFor(() => {
            expect(screen.getByText(/your name is required/i)).toBeInTheDocument();
        });
    });

    test('shows email validation error for bad email', async () => {
        renderContact();
        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Bob' } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'notvalid' } });
        fireEvent.click(screen.getByRole('button', { name: /send message/i }));
        await waitFor(() => {
            expect(screen.getByText(/valid email/i)).toBeInTheDocument();
        });
    });

    test('shows message too short error', async () => {
        renderContact();
        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Bob' } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'bob@test.com' } });
        fireEvent.change(screen.getByLabelText(/your message/i), { target: { value: 'Short' } });
        fireEvent.click(screen.getByRole('button', { name: /send message/i }));
        await waitFor(() => {
            expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument();
        });
    });

    test('shows success message after valid submission', async () => {
        renderContact();
        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Bob Smith' } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'bob@test.com' } });
        fireEvent.change(screen.getByLabelText(/your message/i), { target: { value: 'This is a longer test message to pass validation.' } });
        fireEvent.click(screen.getByRole('button', { name: /send message/i }));
        await waitFor(() => {
            expect(screen.getByText(/message sent/i)).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    test('renders contact channel information', () => {
        renderContact();
        expect(screen.getByText(/hello@PDFBrat\.dev/i)).toBeInTheDocument();
    });
});
