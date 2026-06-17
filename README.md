# Trip Buddy ✈️ — AI-Powered Travel Agent

![Trip Buddy Banner](./assets/banner.png)

Trip Buddy is a premium, modern web application designed to act as your personal travel assistant. Using the power of Google's Gemini AI, it generates fully optimized, custom itineraries based on your budget, travel dates, interests, and style in seconds.

---

## 🌟 Key Features

- **AI Trip Planner:** Craft highly customized, daily itineraries with recommended stays (budget-matched), daily activities, and optimized routes.
- **Discover & Explore:** Browse trending seasonal destinations and view rich travel guides containing country facts, native languages, local currencies, maps, and top tourist landmarks.
- **Interactive Travel Assistant (Roamie):** A built-in AI chatbot that lives right on your itinerary page to help you refine, modify, or answer questions about your trip.
- **PDF Exporter:** Download beautifully formatted PDF itineraries directly to your device.
- **Social Sharing:** Easily share your custom itinerary link with travel companions.
- **Authentication & Dashboard:** Save and manage all your generated itineraries securely.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React with Vite (Fast & Light development server)
- **Styling:** Tailwind CSS (Modern utility classes, sleek gradients, and custom themes)
- **Icons:** Lucide React
- **Document Generation:** jsPDF
- **State & Routing:** React Router DOM, React Hooks

### Backend & AI Services
- **Database & Auth:** Firebase (Firestore and Auth)
- **AI Core:** Google Gemini API (via `@google/genai` sdk)
- **Third-Party APIs:** Wikipedia REST API (summaries), Google Place details API (images/info)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- Firebase Account
- Google Gemini API Key

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd "Trip Buddy"
   ```

2. Install the frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Create a `.env` file in the `frontend` folder and add your API credentials:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   # ... add other firebase configurations as needed
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build the application for production:
   ```bash
   npm run build
   ```

---

## 🎨 Design System

Trip Buddy uses a tailored, high-fidelity design system that includes:
- **Glassmorphism:** Elegant frosted glass panels (`glass-card`) layered over dynamic background meshes.
- **Rich Micro-animations:** Responsive hover states, spin loaders, pulse effects, and smooth layout transitions.
- **Tailored Palettes:** Curated slate, indigo, and purple colors for a modern, high-contrast, premium interface.
- **Interactive State Indicators:** Non-stagnant, custom simulated loading bars and progress stats.

<br>

<p align="center">
  <i>Built with ❤️ for travelers everywhere.</i>
</p>
