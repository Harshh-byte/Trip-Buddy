import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreateTrip from "./pages/CreateTrip";
import Header from "./components/shared/Header";
import { Toaster } from "./components/ui/sonner";
import ViewTrip from "./pages/ViewTrip";
import MyTrips from "./pages/MyTrips";

const App = () => {
  return (
    <>
      <Toaster position="top-center" richColors />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-trip" element={<CreateTrip />} />
        <Route path="/view-trip" element={<ViewTrip />} />
        <Route path="/view-trip/:tripId" element={<ViewTrip />} />
        <Route path="/my-trips" element={<MyTrips />} />
      </Routes>
    </>
  );
};

export default App;
