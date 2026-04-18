import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

const renderNavbar = () =>
    render(<BrowserRouter><Navbar /></BrowserRouter>);

describe('Navbar', () => {
    test('renders the brand name', () => {
        renderNavbar();
        expect(screen.getByText('PDFBrat')).toBeInTheDocument();
    });

    test('renders navigation links: Home, About, Contact', () => {
        renderNavbar();
        expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
    });

    test('renders Login and Get Started buttons', () => {
        renderNavbar();
        expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    });

    test('hamburger button is accessible with aria-label', () => {
        renderNavbar();
        expect(screen.getByLabelText(/toggle mobile menu/i)).toBeInTheDocument();
    });

    test('clicking hamburger opens the mobile menu', () => {
        renderNavbar();
        const hamburger = screen.getByLabelText(/toggle mobile menu/i);
        fireEvent.click(hamburger);
        // Mobile menu links appear (they duplicate the nav links)
        const links = screen.getAllByText(/home/i);
        expect(links.length).toBeGreaterThan(1);
    });

    test('hamburger aria-expanded updates on click', () => {
        renderNavbar();
        const hamburger = screen.getByLabelText(/toggle mobile menu/i);
        expect(hamburger).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(hamburger);
        expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    });
});
