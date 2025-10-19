import { Routes, Route } from "react-router-dom";
import './App.css';
import RegistrationFlow from './Components/RegistrationFlow';
import LoginPage from './Components/LoginPage';
import UserDashboard from './Components/UserDashboard';
import AdminDashboard from './Components/AdminDashboard';
import DepartmentDashboard from './Components/DepartmentDashboard/DepartmentDashboard';

function App() {
  return (
   <Routes>
      <Route path="/" element={<RegistrationFlow />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/AdminDashboard" element={<AdminDashboard />} />
      <Route path="/DepartmentDashboard" element={<DepartmentDashboard />} />
    </Routes>
  );
}

export default App;
