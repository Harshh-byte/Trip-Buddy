import Hero from "../components/shared/Hero";
import SEO from "../components/shared/SEO";

const Home = () => {
  return (
    <>
      <SEO
        title="Home | AI-Powered Travel Agent"
        description="Design your dream getaway in seconds. Tell us where you want to go, and let our advanced AI craft the perfect itinerary tailored to your budget and interests."
        keywords="AI Travel, Trip Planner, Itinerary Generator, Travel Agent, Vacation Planning"
        image="https://trip-buddy-n6b3.onrender.com/favicon.png"
        url="https://trip-buddy-n6b3.onrender.com/"
      />
      <Hero />
    </>
  );
};

export default Home;
