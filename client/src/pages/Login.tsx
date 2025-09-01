import { useState } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('admin@example.com');
    const [password, setPassword] = useState('AdminPass123!');
    const [err, setErr] = useState('');
    const navigate = useNavigate();

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            await api.login(email, password);
            navigate('/framework');
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : 'Login failed');
        }
    }

    return (
        <div className="card max-w-md mx-auto">
            <h1 className="text-xl font-semibold mb-2">Login</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <input className="input" value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="Email" />
                <input className="input" type="password" value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Password" />
                    {err && <div className="text-red-600 text-sm">{err}</div>}
                <button className="btn w-full">Sign in</button>
            </form>
        </div>
    );
}

