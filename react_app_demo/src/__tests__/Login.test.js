import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

const renderLogin = () => render(<BrowserRouter><Login /></BrowserRouter>);

describe('Login Page', () => {
  test('renders the page heading', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  test('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('renders the Sign In submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('shows validation errors when submitted empty', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  test('shows email format error for invalid email', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'notanemail' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  test('shows password length error for short password', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i),       { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  test('renders a link to the Register page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /create one free/i })).toBeInTheDocument();
  });

  test('renders Forgot password link', () => {
    renderLogin();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });
});
