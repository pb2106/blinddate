import { useState } from 'react';
import { Rocket } from 'lucide-react';

const Auth = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const endpoint = isLogin ? `${API_URL}/login` : `${API_URL}/register`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                onLoginSuccess(data.user, data.token);
            } else {
                setError(data.error || 'Authentication failed');
            }
        } catch (err) {
            console.error(err);
            setError("Cannot connect to server.");
        }
    };

    return (
        <div className="auth-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: 'var(--bg-color)',
            color: 'var(--text-primary)'
        }}>
            <div className="auth-card" style={{
                background: 'var(--card-bg)',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '400px',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                    <Rocket size={32} color="var(--accent-primary)" />
                    <h1 style={{ margin: 0 }}>IdeaSpace</h1>
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-control"
                            required
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control"
                            required
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-primary)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0
                        }}
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Auth;
