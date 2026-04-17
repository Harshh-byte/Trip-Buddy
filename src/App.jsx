import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreateTrip from "./pages/CreateTrip";
import Header from "./components/shared/Header";
import { Toaster } from "./components/ui/sonner";
import ViewTrip from "./pages/ViewTrip";
import MyTrips from "./pages/MyTrips";
import PageNotFound from "./pages/PageNotFound";
import Cursor from "./components/shared/Cursor";

const App = () => {
  return (
    <>
      <Toaster position="top-center" richColors />
      <Cursor />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/v2/create-trip" element={<CreateTrip />} />
        <Route path="/v2/view-trip" element={<ViewTrip />} />
        <Route path="/v2/view-trip/:tripId" element={<ViewTrip />} />
        <Route path="/v2/my-trips" element={<MyTrips />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

export default App;
