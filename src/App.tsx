import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-dk-bg">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Dashboard />
      </div>
    </div>
  );
}
