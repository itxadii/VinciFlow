import { Routes, Route } from 'react-router-dom';
import Navbar from './components/landingpage/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Pricing from './pages/Pricing';
import Docs from './pages/Docs';
import Integrations from './pages/Integrations';
import FloatingIcons from './components/FloatingIcons';
import ChatPage from './pages/ChatPage';
import { Authenticator } from '@aws-amplify/ui-react'

const App = () => {
  <Authenticator>
      {({ signOut, user }) => (
        <main>
          {/* Now ChatPage has access to the user's token! */}
          <ChatPage /> 
          <button 
            onClick={signOut}
            className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </main>
      )}
  </Authenticator>
  return (
    <>
      {/* Navbar stays outside because we want it on EVERY page */}
      <Navbar /> 
      <FloatingIcons />
      <Routes>
        <Route path="/chat" element={<ChatPage />} />
        {/* If path is "/", show ONLY LandingPage */}
        <Route path="/" element={<LandingPage />} />
        
        {/* If path is "/login", show ONLY Login */}
        <Route path="/login" element={<Login />} />

        <Route path="pricing" element={<Pricing />} />
        <Route path="docs" element={<Docs />} />
        <Route path="integrations" element={<Integrations />} />
        
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