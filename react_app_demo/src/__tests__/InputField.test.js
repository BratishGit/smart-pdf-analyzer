import { render, screen, fireEvent } from '@testing-library/react';
import InputField from '../components/InputField';

describe('InputField', () => {
    const baseProps = {
        id: 'test-input',
        label: 'Username',
        type: 'text',
        placeholder: 'Enter username',
        value: '',
        onChange: jest.fn(),
    };

    test('renders the label', () => {
        render(<InputField {...baseProps} />);
        expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });

    test('renders the input element', () => {
        render(<InputField {...baseProps} />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('renders placeholder text', () => {
        render(<InputField {...baseProps} />);
        expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    });

    test('fires onChange when user types', () => {
        const onChange = jest.fn();
        render(<InputField {...baseProps} onChange={onChange} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    test('shows error message when error prop is provided', () => {
        render(<InputField {...baseProps} error="This field is required" />);
        expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    test('does not show error message when error prop is absent', () => {
        render(<InputField {...baseProps} />);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('marks input aria-invalid when error prop is provided', () => {
        render(<InputField {...baseProps} error="Bad value" />);
        expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    test('renders required asterisk when required=true', () => {
        render(<InputField {...baseProps} required />);
        // Asterisk is aria-hidden, so check by content
        expect(screen.getByText('*', { selector: 'span[aria-hidden="true"]' })).toBeInTheDocument();
    });

    test('renders textarea when type="textarea"', () => {
        render(<InputField {...baseProps} type="textarea" />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        // textarea has tagName TEXTAREA
        expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
    });

    test('email input has type="email"', () => {
        render(<InputField {...baseProps} type="email" />);
        const input = screen.getByLabelText(/Username/i);
        expect(input).toHaveAttribute('type', 'email');
    });
});
