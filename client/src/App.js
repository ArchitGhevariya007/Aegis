import { Routes, Route } from "react-router-dom";
import './App.css';
import RegistrationFlow from './COMPONENTS/RegistrationFlow';
import LoginPage from './COMPONENTS/LoginPage';

function App() {
  return (
   <Routes>
      <Route path="/" element={<RegistrationFlow />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
