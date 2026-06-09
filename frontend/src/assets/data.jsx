import {
  IndianRupee,
  MountainSnow,
  Landmark,
  UtensilsCrossed,
  Palmtree,
  Beer,
  Trees,
  ShoppingBag,
  Heart,
  Home,
  User,
  UsersRound,
  FerrisWheel,
} from "lucide-react";

export const BUDGET_OPTIONS = [
  {
    id: "Budget",
    label: "Low",
    desc: "Keep it lean with budget stays, local eats, and low-cost sights.",
    icon: <IndianRupee className="w-6 h-6" />,
  },
  {
    id: "Moderate",
    label: "Medium",
    desc: "A balanced mix of comfort and value with solid hotels and good dining.",
    icon: (
      <div className="flex items-center gap-0.5">
        <IndianRupee className="w-6 h-6" />
      </div>
    ),
  },
  {
    id: "Luxury",
    label: "High",
    desc: "Go all in with premium stays, fine dining, and exclusive experiences.",
    icon: (
      <div className="flex items-center gap-0.5">
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
    desc: "Romantic getaways",
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

export const INTEREST_OPTIONS = [
  {
    id: "General",
    label: "General",
    desc: "Sightseeing, landmarks, and balanced activities",
    icon: <FerrisWheel className="w-6 h-6" />,
  },
  {
    id: "Adventure",
    label: "Adventure",
    desc: "Hiking, water sports, and thrill-seeking",
    icon: <MountainSnow className="w-6 h-6" />,
  },
  {
    id: "Culture",
    label: "Culture",
    desc: "Museums, historical sites, and local traditions",
    icon: <Landmark className="w-6 h-6" />,
  },
  {
    id: "Food",
    label: "Food",
    desc: "Local cuisine, street food, and fine dining",
    icon: <UtensilsCrossed className="w-6 h-6" />,
  },
  {
    id: "Relaxation",
    label: "Relaxation",
    desc: "Beaches, spas, and slow-paced days",
    icon: <Palmtree className="w-6 h-6" />,
  },
  {
    id: "Nightlife",
    label: "Nightlife",
    desc: "Bars, clubs, and evening entertainment",
    icon: <Beer className="w-6 h-6" />,
  },
  {
    id: "Nature",
    label: "Nature",
    desc: "National parks, wildlife, and scenic views",
    icon: <Trees className="w-6 h-6" />,
  },
  {
    id: "Shopping",
    label: "Shopping",
    desc: "Local markets, boutiques, and malls",
    icon: <ShoppingBag className="w-6 h-6" />,
  },
];
