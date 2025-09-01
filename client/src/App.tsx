import { Link, Outlet } from 'react-router-dom';
import './index.css';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-5xl mx-auto p-3 flex gap-4">
          <Link to="/" className="font-semibold">Home</Link>
          <Link to="/framework">Framework Entry</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/account">Account</Link>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
