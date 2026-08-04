# Trip Buddy ✈️ — AI-Powered Travel Agent

![Trip Buddy Banner](./assets/banner.png)

Trip Buddy is a premium, modern web application designed to act as your personal travel assistant. Using the power of Google's Gemini AI, it generates fully optimized, custom itineraries based on your budget, travel dates, interests, and style in seconds.

---

## 🌟 Key Features

- **AI Trip Planner:** Craft highly customized, daily itineraries with recommended stays (budget-matched), daily activities, and optimized routes.
- **Discover & Explore:** Browse trending seasonal destinations and view rich travel guides containing country facts, native languages, local currencies, maps, and top tourist landmarks.
- **Interactive Travel Assistant (Roamie):** A built-in AI chatbot that lives right on your itinerary page to help you refine, modify, or answer questions about your trip.
- **100% Free Access:** Enjoy all feature sets—including AI generation, Roamie chat, collaborative editing, and PDF downloads—completely free of charge.
- **PDF Exporter:** Download beautifully formatted PDF itineraries directly to your device.
- **Social Sharing:** Easily share your custom itinerary link with travel companions.
- **Authentication & Dashboard:** Save and manage all your generated itineraries securely.
- **Admin Tools:** Manage users, trips, analytics, and settings from the admin dashboard.

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

### 🌐 Dual AI Generation Architecture
* **Initial Trip Generation**: Handled asynchronously by a Firestore trigger Cloud Function (`backend/functions/index.js`) listening to new entries in `Trip_requests/{requestId}`. This uses the Gemini API (`gemini-2.5-flash-lite`) and integrates with Resend to email travelers when complete.
* **Roamie Chat Assistant**: Runs directly on the client frontend utilizing Vite environment variables (`VITE_GEMINI_API_KEY`) to call `gemini-2.5-flash` directly for real-time response generation.

### 🗄️ Firestore Database Schema
* **`users/{uid}`**: Stores user profiles.
  * `uid`: String
  * `email`: String
  * `name`: String
  * `picture`: String
  * `provider`: String
  * `isAdmin`: Boolean (controls admin console access)
* **`users/{uid}/trips/{tripId}`**: Local reference for user's generated itineraries.
* **`Trips/{tripId}`**: Public shared itineraries.
  * `tripData`: JSON itinerary structure
  * `userSelection`: Form options selected
  * `sharingMode`: `"view"` or `"edit"`
  * `userId`: Owner's user ID
* **`Trip_requests/{requestId}`**: Users create trip request logs here, triggering the Cloud Function generation pipeline.

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

3. Create a `.env` file in the `frontend` folder and add your credentials:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GOOGLE_AUTH_CLIENT_ID=your_google_oauth_client_id
   VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key
   VITE_ADMIN_SEED_SECRET=your_admin_secret_phrase
   ```

4. Run the development server:
   ```bash
   cd frontend
   npm run dev
   ```

5. Build the application for production:
   ```bash
   cd frontend
   npm run build
   ```

---

## 🎨 Design System

Trip Buddy uses a tailored, high-fidelity design system that includes:
- **Glassmorphism:** Elegant frosted glass panels (`glass-card`) layered over dynamic background meshes.
- **Rich Micro-animations:** Responsive hover states, spin loaders, pulse effects, and smooth layout transitions.
- **Tailored Palettes:** Curated slate, indigo, and purple colors for a modern, high-contrast, premium interface.
- **Interactive State Indicators:** Non-stagnant, custom simulated loading bars and progress stats.

## 💳 Plans

- **Trip Buddy Free:** Core trip generation, exploration, and saved itineraries.
- **Trip Buddy Subscriber:** $7.99/month for Roamie AI chat, collaborative editing, and PDF downloads.

<br>

<p align="center">
  <i>Built with ❤️ for travelers everywhere.</i>
</p>
