import { Routes, Route } from "react-router-dom";
import './App.css';
import RegistrationFlow from './COMPONENTS/RegistrationFlow';
import LoginPage from './COMPONENTS/LoginPage';

// Simple Dashboard Component
const Dashboard = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
      <h1 className="text-3xl font-semibold text-emerald-600 mb-4">Welcome to Dashboard!</h1>
      <p className="text-slate-600 mb-6">You have successfully logged in to the Digital ID System.</p>
      <a 
        href="/" 
        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
      >
        Go to Registration
      </a>
    </div>
  </div>
);

function App() {
  return (
   <Routes>
      <Route path="/" element={<RegistrationFlow />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
