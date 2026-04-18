import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';

const renderRegister = () => render(<BrowserRouter><Register /></BrowserRouter>);

describe('Register Page', () => {
    test('renders the page heading', () => {
        renderRegister();
        expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
    });

    test('renders all 4 form fields', () => {
        renderRegister();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    test('renders the Create Account button', () => {
        renderRegister();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    test('shows name required error on empty submit', async () => {
        renderRegister();
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));
        await waitFor(() => {
            expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
        });
    });

    test('shows password mismatch error', async () => {
        renderRegister();
        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Alice' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@test.com' } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different' } });
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));
        await waitFor(() => {
            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        });
    });

    test('shows password too short error', async () => {
        renderRegister();
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'abc' } });
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));
        await waitFor(() => {
            expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
        });
    });

    test('renders a link to the Login page', () => {
        renderRegister();
        expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });
});
