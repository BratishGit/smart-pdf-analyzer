import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../components/Footer';

const renderFooter = () =>
    render(<BrowserRouter><Footer /></BrowserRouter>);

describe('Footer', () => {
    test('renders the PDFBrat brand name', () => {
        renderFooter();
        expect(screen.getByText('PDFBrat')).toBeInTheDocument();
    });

    test('renders tagline text', () => {
        renderFooter();
        expect(screen.getByText(/building the future/i)).toBeInTheDocument();
    });

    test('renders Product section heading', () => {
        renderFooter();
        expect(screen.getByText('Product')).toBeInTheDocument();
    });

    test('renders Account section heading', () => {
        renderFooter();
        expect(screen.getByText('Account')).toBeInTheDocument();
    });

    test('renders the Copyright line', () => {
        renderFooter();
        expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
    });

    test('footer has contentinfo role', () => {
        renderFooter();
        expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    test('shows social media link section', () => {
        renderFooter();
        expect(screen.getByLabelText(/social media links/i)).toBeInTheDocument();
    });
});
