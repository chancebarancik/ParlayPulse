import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-dk-bg">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Dashboard />
      </div>
    </div>
  );
}
