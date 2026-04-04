import { IndianRupee } from "lucide-react";
import { Heart, Home, User, Users, UsersRound } from "lucide-react";

export const BUDGET_OPTIONS = [
  {
    id: "Budget",
    label: "Low",
    desc: "₹1500 - ₹3500 per person/day",
    icon: <IndianRupee className="w-6 h-6" />,
  },
  {
    id: "Moderate",
    label: "Medium",
    desc: "₹3500 - ₹8000 per person/day",
    icon: (
      <div className="flex items-center gap-0.5">
        <IndianRupee className="w-6 h-6" />
        <IndianRupee className="w-6 h-6" />
      </div>
    ),
  },
  {
    id: "Luxury",
    label: "High",
    desc: "₹8000+ per person/day",
    icon: (
      <div className="flex items-center gap-0.5">
        <IndianRupee className="w-6 h-6" />
        <IndianRupee className="w-6 h-6" />
        <IndianRupee className="w-6 h-6" />
      </div>
    ),
  },
];

export const FAQ_DATA = [
  {
    question: "What is Trip Buddy?",
    answer:
      "Imagine having a personal travel agent in your pocket. Trip Buddy is an AI-powered travel planner that creates bespoke itineraries based on your budget, interests, and travel style in seconds.",
  },
  {
    question: "Is Trip Buddy free to use?",
    answer:
      "Yes, Trip Buddy is currently a free planning tool. Our AI trip planner is designed to provide high-quality service without any cost.",
  },
  {
    question: "How does Trip Buddy create personalized recommendations?",
    answer:
      "By taking into account your unique preferences, tastes, and requirements, ensuring that every aspect of your trip is tailored to meet your specific needs.",
  },
  {
    question: "How do I find my trips in My Trips?",
    answer:
      "Your generated itineraries are saved to your account and appear in My Trips, so you can revisit them anytime after signing in.",
  },
  {
    question: "How accurate are the travel suggestions?",
    answer:
      "Our AI uses real-time data and travel trends, though we always recommend checking local opening hours before your visit.",
  },
];

export const TRAVELER_OPTIONS = [
  {
    id: "Solo",
    title: "Solo",
    icon: <User className="w-6 h-6" />,
    desc: "Exploring at your own pace",
    people: "1 Person",
  },
  {
    id: "Couple",
    title: "Couple",
    icon: <Heart className="w-6 h-6" />,
    desc: "Romatic getaways",
    people: "2 People",
  },
  {
    id: "Family",
    title: "Family",
    icon: <Home className="w-6 h-6" />,
    desc: "Kid-friendly activities",
    people: "3 to 5 People",
  },
  {
    id: "Friends",
    title: "Friends",
    icon: <UsersRound className="w-6 h-6" />,
    desc: "Thrill-seekers group",
    people: "5+ People",
  },
];
