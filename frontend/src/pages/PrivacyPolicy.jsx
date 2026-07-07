import { Link } from 'react-router-dom';
import { Plane } from 'lucide-react';
import SEO from '../components/shared/SEO';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50/30 font-sans flex flex-col">
      <SEO title="Privacy Policy" description="How we protect your data at Trip Buddy." />
      
      <header className="border-b border-slate-100 py-4 px-6 bg-white/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <Link to="/" className="flex items-center gap-x-2.5 group">
              <div className="bg-indigo-600 p-2 rounded-sm group-hover:rotate-12 transition-all duration-500">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="font-black tracking-tighter text-slate-900 text-xl select-none">
                Trip <span className="text-indigo-600">Buddy</span>
              </span>
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <span className="text-sm font-bold text-slate-500 tracking-tight">
              Privacy Policy
            </span>
          </div>
          
          <Link
            to="/"
            className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-8 pb-16 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-4xl border border-slate-100 p-8 md:p-12 shadow-sm">
          <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
              <p>
                When you use Trip Buddy, we collect information that you explicitly provide, such as your name, email address, profile picture (via third-party auth providers like Google or customized avatars), 
                and travel preferences when creating an account or planning trips. We also collect and store the details of any custom itineraries you generate.
              </p>
              <p className="mt-2">
                We utilize browser local storage to cache active trip generation requests, keep track of your local offline itineraries, and maintain session status. Cookies are used for standard session handling and secure authentication.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
              <p>
                We use your information to provide our services, personalize your travel itineraries, 
                and improve the trip recommendations. We do not sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. However, no method 
                of transmission over the internet is 100% secure, and we cannot guarantee absolute security of your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Third-Party Services</h2>
              <p>
                We integrate with secure external service providers to facilitate authentication, database storage, mapping, and artificial intelligence-based travel generation:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Firebase (Google):</strong> Used for secure authentication, Firestore database storage, and hosting backend Cloud Functions.</li>
                <li><strong>Google Gemini AI:</strong> Used to analyze travel options and generate custom itineraries and real-time chatbot responses.</li>
                <li><strong>Google Places API:</strong> Used for autocomplete location searches and fetching location-specific images/details.</li>
                <li><strong>Wikipedia REST API:</strong> Used to fetch summaries and cultural details of countries and destinations.</li>
              </ul>
              <p className="mt-2">
                These third-party platforms have their own privacy policies and security standards.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Your Data Rights</h2>
              <p>
                Depending on your location, you may have rights to access, correct, or delete the personal information we hold about you. 
                If you wish to delete your account or any of your generated trips, you can manage your data directly from your profile or contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Contact Us</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy or how your data is handled, please contact us at:
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                privacy@tripbuddy.io
              </p>
            </section>

            <section className="pt-8 border-t border-slate-100">
              <p className="text-sm font-medium">Last updated: July 2026</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
