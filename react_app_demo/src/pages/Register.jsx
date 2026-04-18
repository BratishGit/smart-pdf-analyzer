import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'Full name is required';
        if (!form.username.trim()) e.username = 'Username is required';
        else if (form.username.length < 3) e.username = 'Username must be at least 3 characters';
        if (!form.email) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
        if (!form.password) e.password = 'Password is required';
        else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
        if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
        return e;
    };

    const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});
        setServerError('');
        setLoading(true);

        try {
            // BUG FIX #5: Destructure - do NOT send 'confirm' to the API
            const { confirm, ...payload } = form;
            const { data } = await api.post('/auth/register', payload);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                username: data.username,
                email: data.email,
                fullName: data.fullName
            }));
            navigate('/dashboard');
        } catch (err) {
            setServerError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const strength = (() => {
        const p = form.password;
        if (!p) return 0;
        let s = 0;
        if (p.length >= 8) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/\d/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    })();

    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
    const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-400', 'bg-green-500'][strength];

    return (
        <main className="w-full min-h-[90vh] flex items-center justify-center relative overflow-hidden bg-bgDark py-12">
            <div className="absolute top-1/4 -right-32 w-96 h-96 bg-accent rounded-full opacity-[0.07] blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-purple-500 rounded-full opacity-[0.07] blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="w-full max-w-lg mx-auto p-8 sm:p-10 bg-bgCard border border-border rounded-3xl shadow-2xl relative z-10 my-10">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-accentGlow flex items-center justify-center text-accent text-xl mb-4">✦</div>
                    <h1 className="text-3xl font-display font-bold text-textPrimary tracking-tight">Create an account</h1>
                    <p className="text-textSecondary mt-2">Join thousands of users building with PDFBrat</p>
                </div>

                <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
                    {serverError && (
                        <p className="p-3 rounded-xl bg-danger/10 text-danger font-medium border border-danger/20 text-center text-sm">{serverError}</p>
                    )}

                    {[
                        { field: 'fullName',  label: 'Full Name',  type: 'text',     placeholder: 'John Doe' },
                        { field: 'username',  label: 'Username',   type: 'text',     placeholder: 'your_username' },
                        { field: 'email',     label: 'Email',      type: 'email',    placeholder: 'you@example.com' },
                    ].map(({ field, label, type, placeholder }) => (
                        <div key={field} className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-textSecondary">{label} <span className="text-danger">*</span></label>
                            <input
                                type={type}
                                className={`w-full px-4 py-3 rounded-xl bg-bgElevated border text-textPrimary outline-none focus:ring-2 focus:ring-accentGlow transition-all ${errors[field] ? 'border-danger' : 'border-border focus:border-accent'}`}
                                placeholder={placeholder}
                                value={form[field]}
                                onChange={handleChange(field)}
                            />
                            {errors[field] && <span className="text-xs text-danger font-medium">{errors[field]}</span>}
                        </div>
                    ))}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-textSecondary">Password <span className="text-danger">*</span></label>
                        <input
                            type="password"
                            className={`w-full px-4 py-3 rounded-xl bg-bgElevated border text-textPrimary outline-none focus:ring-2 focus:ring-accentGlow transition-all ${errors.password ? 'border-danger' : 'border-border focus:border-accent'}`}
                            placeholder="At least 6 characters"
                            value={form.password}
                            onChange={handleChange('password')}
                        />
                        {form.password && (
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex gap-1 flex-1">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-border'}`} />
                                    ))}
                                </div>
                                <span className="text-xs font-semibold text-textSecondary">{strengthLabel}</span>
                            </div>
                        )}
                        {errors.password && <span className="text-xs text-danger font-medium">{errors.password}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-textSecondary">Confirm Password <span className="text-danger">*</span></label>
                        <input
                            type="password"
                            className={`w-full px-4 py-3 rounded-xl bg-bgElevated border text-textPrimary outline-none focus:ring-2 focus:ring-accentGlow transition-all ${errors.confirm ? 'border-danger' : 'border-border focus:border-accent'}`}
                            placeholder="Repeat your password"
                            value={form.confirm}
                            onChange={handleChange('confirm')}
                        />
                        {errors.confirm && <span className="text-xs text-danger font-medium">{errors.confirm}</span>}
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white font-bold text-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
                        disabled={loading}
                    >
                        {loading ? 'Creating account…' : 'Create Account →'}
                    </button>
                </form>

                <p className="mt-6 text-center text-textSecondary text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-textPrimary hover:text-accent transition-colors">Sign in</Link>
                </p>
            </div>
        </main>
    );
};

export default Register;
