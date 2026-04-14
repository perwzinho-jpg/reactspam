import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomToaster from './components/Toast';
import { useAuthStore } from './store/authStore';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
import Instances from './pages/Instances';
import Campaigns from './pages/Campaigns';
import CampaignDetails from './pages/CampaignDetails';
import Proxys from './pages/Proxys';
import WhatsAppProfile from './pages/WhatsAppProfile';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Layout from './components/Layout';
import Resources from './pages/Resources';
import Pricing from './pages/Pricing';
import Docs from './pages/Docs';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Compliance from './pages/Compliance';
import About from './pages/About';

function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { token } = useAuthStore();
  return !token ? children : <Navigate to="/app/dashboard" />;
}

function App() {
  return (
    <Router>
      <CustomToaster />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/about" element={<About />} />

        {/* Private Routes */}
        <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/app/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="campaigns/:id" element={<CampaignDetails />} />
          <Route path="instances" element={<Instances />} />
          <Route path="whatsapp-profile" element={<WhatsAppProfile />} />
          <Route path="templates" element={<Templates />} />
          <Route path="proxys" element={<Proxys />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
