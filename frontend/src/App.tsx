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
import Onboarding from './pages/auth/Onboarding';
// 1. Import the new ConnectX component
import ConnectX from './pages/auth/ConnectX';

const App = () => {
  const location = useLocation();
  
  /** * FIX: startsWith use karna zyada robust hai trailing slashes ke liye.
   * Navbar/Icons hide on chat, onboarding, AND connect-x pages.
   */
  const isAppView = ['/chat', '/onboarding', '/connect-x'].some(path => 
    location.pathname.startsWith(path)
  );

  return (
    <>
      {!isAppView && (
        <>
          <Navbar />
          <FloatingIcons />
        </>
      )}

      <Routes>
        {/* Protected Application Routes */}
        <Route 
          path="/chat" 
          element={
            <AuthPage>
              <ChatPage />
            </AuthPage>
          } 
        />

        <Route 
          path="/onboarding" 
          element={
            <AuthPage>
              <Onboarding />
            </AuthPage>
          } 
        />

        {/* 2. NEW: Protected X Integration Route */}
        <Route 
          path="/connect-x" 
          element={
            <AuthPage>
              <ConnectX />
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

        <Route path="*" element={<div className="pt-24 text-center text-slate-500 font-['Merriweather']">404 - Aura Not Found</div>} />
      </Routes>
    </>
  );
};

export default App;