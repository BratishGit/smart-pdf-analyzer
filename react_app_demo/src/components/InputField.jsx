import React from 'react';

/**
 * InputField – reusable labelled form input for the Contact page.
 * Supports type="text", "email", "tel", and textarea.
 *
 * Props: id, label, type, placeholder, value, onChange, error, required, rows
 */
const InputField = ({
    id,
    label,
    type = 'text',
    placeholder = '',
    value,
    onChange,
    error,
    required = false,
    rows,
}) => (
    <div className="form-group">
        <label className="form-label" htmlFor={id}>
            {label}
            {required && <span aria-hidden="true" style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}
        </label>

        {type === 'textarea' ? (
            <textarea
                id={id}
                className={`form-input${error ? ' form-input--error' : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                rows={rows || 5}
                required={required}
                aria-required={required}
                aria-describedby={error ? `${id}-error` : undefined}
                aria-invalid={!!error}
                style={error ? { borderColor: 'var(--danger)' } : undefined}
            />
        ) : (
            <input
                id={id}
                type={type}
                className={`form-input${error ? ' form-input--error' : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                aria-required={required}
                aria-describedby={error ? `${id}-error` : undefined}
                aria-invalid={!!error}
                style={error ? { borderColor: 'var(--danger)' } : undefined}
            />
        )}

        {error && (
            <span id={`${id}-error`} className="form-error" role="alert">
                {error}
            </span>
        )}
    </div>
);

export default InputField;
