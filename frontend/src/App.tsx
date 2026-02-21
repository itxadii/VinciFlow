import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/landingpage/Navbar';
import LandingPage from './pages/LandingPage';
import Pricing from './pages/Pricing';
import Docs from './pages/Docs';
import Integrations from './pages/Integrations';
import FloatingIcons from './components/FloatingIcons';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/auth/AuthPage';
import CustomLogin from './pages/auth/CustomLogin';
import CustomSignUp from './pages/auth/CustomSignUp';
import ConfirmAccount from './pages/auth/ConfirmAccount';

const App = () => {
  // 1. Hook to get current path
  const location = useLocation();
  
  // 2. Determine if we are on the chat page
  const isChatPage = location.pathname === '/chat';

  return (
    <>
      {/* 3. Conditional Rendering: Only show Navbar and Icons if NOT in chat */}
      {!isChatPage && (
        <>
          <Navbar />
          <FloatingIcons />
        </>
      )}

      <Routes>
        {/* Protected Route: Wrapped in your AuthPage gatekeeper */}
        <Route 
          path="/chat" 
          element={
            <AuthPage>
              <ChatPage />
            </AuthPage>
          } 
        />

        {/* Public Routes */}
        <Route path="/signup" element={<CustomSignUp />} />
        <Route path="/confirm" element={<ConfirmAccount />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<CustomLogin />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/integrations" element={<Integrations />} />
        
        <Route path="/dashboard" element={
          <div className="pt-24 p-8 text-center font-bold">
            VinciFlow Dashboard (Gemini Integration Soon)
          </div>
        } />

        <Route path="*" element={<div className="pt-24 text-center">404 - Not Found</div>} />
      </Routes>
    </>
  );
};

export default App;