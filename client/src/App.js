import { Routes, Route } from "react-router-dom";
import './App.css';
import RegistrationFlow from './COMPONENTS/RegistrationFlow';
import LoginPage from './COMPONENTS/LoginPage';
import UserDashboard from './COMPONENTS/UserDashboard';
import AdminDashboard from './COMPONENTS/AdminDashboard';

function App() {
  return (
   <Routes>
      <Route path="/" element={<RegistrationFlow />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/AdminDashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
