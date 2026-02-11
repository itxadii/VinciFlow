import { Routes, Route } from 'react-router-dom';
import Navbar from './components/landingpage/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';

const App = () => {
  return (
    <>
      <Navbar /> 
      <Routes>
        {/* Landing Page Route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Login Page Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard Route */}
        <Route path="/dashboard" element={
          <div className="pt-24 p-8 text-center font-bold">
            VinciFlow Dashboard (Gemini Integration Soon)
          </div>
        } />
        {/* Catch-all 404 */}
        <Route path="*" element={<div className="pt-24 text-center">404 - Not Found</div>} />
      </Routes>
    </>
  );
};

export default App;