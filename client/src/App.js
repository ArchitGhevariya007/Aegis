import { Routes, Route } from "react-router-dom";
import './App.css';
import RegistrationFlow from './Components/RegistrationFlow';
import LoginPage from './Components/LoginPage';
import UserDashboard from './Components/UserDashboard';
import AdminDashboard from './Components/AdminDashboard';

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
