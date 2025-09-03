import { Outlet } from 'react-router-dom';
import { DemoProvider } from './contexts/DemoContext';
import Navigation from './components/Navigation';

export default function App() {
  return (
    <DemoProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Outlet />
      </div>
    </DemoProvider>
  );
}
