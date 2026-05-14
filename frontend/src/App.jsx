import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import CreateTrip from "./pages/CreateTrip";
import Header from "./components/shared/Header";
import { Toaster } from "./components/ui/sonner";
import ViewTrip from "./pages/ViewTrip";
import MyTrips from "./pages/MyTrips";
import PageNotFound from "./pages/PageNotFound";
import Footer from "./components/shared/Footer";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ScrollToTop from "./components/shared/ScrollToTop";
import Explore from "./pages/Explore";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTrips from "./pages/admin/AdminTrips";
import AdminSettings from "./pages/admin/AdminSettings";

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" richColors />
      {!isAdminRoute && <Header />}
      <main className="flex-1">
        <ScrollToTop />
        <Routes>
          {/* Main App Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/v2/create-trip" element={<CreateTrip />} />
          <Route path="/v2/view-trip" element={<ViewTrip />} />
          <Route path="/v2/view-trip/:tripId" element={<ViewTrip />} />
          <Route path="/v2/my-trips" element={<MyTrips />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/explore" element={<Explore />} />

          {/* Admin Core Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="trips" element={<AdminTrips />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

export default App;
