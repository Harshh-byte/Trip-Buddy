import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreateTrip from "./pages/CreateTrip";
import Header from "./components/shared/Header";
import { Toaster } from "./components/ui/sonner";
import ViewTrip from "./pages/ViewTrip";
import MyTrips from "./pages/MyTrips";
import PageNotFound from "./pages/PageNotFound";

import Footer from "./components/shared/Footer";

const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" richColors />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/v2/create-trip" element={<CreateTrip />} />
          <Route path="/v2/view-trip" element={<ViewTrip />} />
          <Route path="/v2/view-trip/:tripId" element={<ViewTrip />} />
          <Route path="/v2/my-trips" element={<MyTrips />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
