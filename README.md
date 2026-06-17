<h1 align="center">Trip Buddy ✈️</h1>

<p align="center">
  <strong>Your AI-Powered Personal Travel Assistant</strong>
</p>

<p align="center">
  <img src="./assets/banner.png" alt="Trip Buddy Banner" width="100%">
</p>

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-design-system">Design System</a>
</p>

---

**Trip Buddy** is a premium, modern web application designed to act as your personal travel assistant. Harnessing the power of Google's **Gemini AI**, it instantly generates fully optimized, custom itineraries tailored to your budget, travel dates, interests, and personal style. 

Say goodbye to endless hours of travel research and hello to seamless, dynamic trip planning. 🌍✨

---

## 🌟 Key Features

- **🧠 AI Trip Planner:** Craft highly customized, day-by-day itineraries with budget-matched stay recommendations, curated daily activities, and optimized routes.
- **🌍 Discover & Explore:** Browse trending seasonal destinations. View rich travel guides containing country facts, native languages, local currencies, interactive maps, and top tourist landmarks.
- **💬 Interactive Travel Assistant (Roamie):** A built-in AI chatbot that lives right on your itinerary page to help you refine, modify, or answer questions about your trip in real-time.
- **📄 PDF Exporter:** Download beautifully formatted PDF itineraries directly to your device for offline access.
- **🔗 Social Sharing:** Easily share your custom itinerary link with your travel companions.
- **🔒 Authentication & Dashboard:** Securely save and manage all your generated itineraries in your personal dashboard.

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
- **AI Core:** Google Gemini API (via `@google/genai` SDK)
- **Third-Party APIs:** Wikipedia REST API (summaries), Google Places API (images/info)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Firebase Account** for Auth and Firestore
- **Google Gemini API Key**

### Installation

1. **Clone the repository** and navigate to the project directory:
   ```bash
   git clone <your-repo-url>
   cd "Trip Buddy"
   ```

2. **Install the frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `frontend` folder and add your API credentials:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   # ... add other Firebase configurations as needed
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🎨 Design System

Trip Buddy utilizes a tailored, high-fidelity design system aimed at delivering a premium user experience:
- **Glassmorphism:** Elegant frosted glass panels (`glass-card`) layered over dynamic background meshes.
- **Rich Micro-animations:** Responsive hover states, spin loaders, pulse effects, and smooth layout transitions.
- **Tailored Palettes:** Curated slate, indigo, and purple colors for a modern, high-contrast, premium interface.
- **Interactive State Indicators:** Non-stagnant, custom simulated loading bars and progress stats to keep users engaged.

<p align="center">
  <i>Built with ❤️ for travelers everywhere.</i>
</p>
