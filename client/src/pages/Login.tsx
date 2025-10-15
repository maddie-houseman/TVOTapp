import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyDomain, setCompanyDomain] = useState('');
    const [role, setRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');
    const [adminPassword, setAdminPassword] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [err, setErr] = useState('');
    const navigate = useNavigate();
    const { login, signup } = useAuth();

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErr('');
        
        // Validate admin password if admin role is selected
        if (isSignup && role === 'ADMIN' && adminPassword !== 'ADMINPASS') {
            setErr('Invalid admin password. Please enter ADMINPASS to create an admin account.');
            return;
        }
        
        try {
            if (isSignup) {
                await signup(email, password, name, companyName, companyDomain, role);
            } else {
                await login(email, password);
            }
            navigate('/');
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : (isSignup ? 'Signup failed' : 'Login failed'));
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isSignup ? 'Create your account' : 'Sign in to your account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {isSignup ? 'Join your company or create a new one' : 'Database connection required for authentication'}
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={onSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        {isSignup && (
                            <div>
                                <label htmlFor="name" className="sr-only">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required={isSignup}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${isSignup ? '' : 'rounded-t-md'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isSignup ? "new-password" : "current-password"}
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${isSignup ? '' : 'rounded-b-md'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {isSignup && (
                            <>
                                <div>
                                    <label htmlFor="company-name" className="sr-only">
                                        Company Name
                                    </label>
                                    <input
                                        id="company-name"
                                        name="companyName"
                                        type="text"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Company Name"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="company-domain" className="sr-only">
                                        Company Domain (Optional)
                                    </label>
                                    <input
                                        id="company-domain"
                                        name="companyDomain"
                                        type="text"
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Company Domain (Optional)"
                                        value={companyDomain}
                                        onChange={(e) => setCompanyDomain(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="role" className="sr-only">
                                        Role
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as 'EMPLOYEE' | 'ADMIN')}
                                    >
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                {role === 'ADMIN' && (
                                    <div>
                                        <label htmlFor="admin-password" className="sr-only">
                                            Admin Password
                                        </label>
                                        <input
                                            id="admin-password"
                                            name="adminPassword"
                                            type="password"
                                            required
                                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                            placeholder="Admin Password (ADMINPASS)"
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {err && (
                        <div className="text-red-600 text-sm text-center">
                            {err}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {isSignup ? 'Create Account' : 'Sign in'}
                        </button>
                    </div>
                    
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignup(!isSignup);
                                setErr('');
                                setEmail('');
                                setPassword('');
                                setName('');
                                setCompanyName('');
                                setCompanyDomain('');
                                setRole('EMPLOYEE');
                                setAdminPassword('');
                            }}
                            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

