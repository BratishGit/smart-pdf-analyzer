import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const validate = () => {
        const e = {};
        if (!form.username) e.username = 'Username is required';
        if (!form.password) e.password = 'Password is required';
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
            const { data } = await api.post('/auth/login', form);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({
                username: data.username,
                email: data.email,
                fullName: data.fullName
            }));
            setLoading(false);
            navigate('/dashboard');
        } catch (err) {
            setServerError(err.response?.data?.error || 'Invalid credentials. Please try again.');
            setLoading(false);
        }
    };

    return (
        <main className="w-full min-h-[90vh] flex items-center justify-center relative overflow-hidden bg-bgDark" role="main" id="login-page">
            {/* Decorative blobs */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent rounded-full opacity-[0.1] blur-[120px] animate-pulse" aria-hidden="true" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent2 rounded-full opacity-[0.1] blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} aria-hidden="true" />

            <div className="w-full max-w-md mx-auto p-8 sm:p-10 bg-bgCard border border-border rounded-3xl shadow-2xl relative z-10 animate-in slide-in-from-bottom-8 fade-in duration-500 my-10">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-12 h-12 rounded-xl bg-accentGlow flex items-center justify-center text-accent text-xl mb-4" aria-hidden="true">✦</div>
                    <h1 className="text-3xl font-display font-bold text-textPrimary tracking-tight">Welcome back</h1>
                    <p className="text-textSecondary mt-2">Sign in to continue to PDFBrat</p>
                </div>

                <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate aria-label="Login form">
                    {serverError && <p className="p-3 rounded-xl bg-danger/10 text-danger font-medium border border-danger/20 text-center text-sm">{serverError}</p>}
                    
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-textSecondary" htmlFor="login-username">Username</label>
                        <input
                            id="login-username"
                            type="text"
                            className={`w-full px-4 py-3 rounded-xl bg-bgElevated border text-textPrimary outline-none focus:ring-2 focus:ring-accentGlow transition-all ${errors.username ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'}`}
                            placeholder="your_username"
                            value={form.username}
                            onChange={handleChange('username')}
                            autoComplete="username"
                            aria-required="true"
                            aria-invalid={!!errors.username}
                            aria-describedby={errors.username ? 'login-username-error' : undefined}
                        />
                        {errors.username && <span id="login-username-error" className="text-xs text-danger font-medium mt-1" role="alert">{errors.username}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-textSecondary" htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            className={`w-full px-4 py-3 rounded-xl bg-bgElevated border text-textPrimary outline-none focus:ring-2 focus:ring-accentGlow transition-all ${errors.password ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'}`}
                            placeholder="At least 6 characters"
                            value={form.password}
                            onChange={handleChange('password')}
                            autoComplete="current-password"
                            aria-required="true"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? 'login-password-error' : undefined}
                        />
                        {errors.password && <span id="login-password-error" className="text-xs text-danger font-medium mt-1" role="alert">{errors.password}</span>}
                    </div>

                    <div className="flex justify-end">
                        <a href="/" className="text-sm font-medium text-accentLight hover:text-accent transition-colors">Forgot password?</a>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white font-bold text-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                        id="login-submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Signing in…' : 'Sign In →'}
                    </button>
                </form>

                <p className="mt-8 text-center text-textSecondary text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-semibold text-textPrimary hover:text-accent transition-colors" id="login-register-link">Create one free</Link>
                </p>
            </div>
        </main>
    );
};

export default Login;
