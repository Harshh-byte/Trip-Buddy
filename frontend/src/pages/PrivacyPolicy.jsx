import { Link } from 'react-router-dom';
import { Plane } from 'lucide-react';
import SEO from '../components/shared/SEO';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50/30 font-sans flex flex-col">
      <SEO title="Privacy Policy" description="How we protect your data at Trip Buddy." />
      
      {/* Custom document header */}
      <header className="border-b border-slate-100 py-4 px-6 bg-white/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <Link to="/" className="flex items-center gap-x-2.5 group">
              <div className="bg-indigo-600 p-2 rounded-sm group-hover:rotate-12 transition-all duration-500">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-base tracking-tighter text-slate-900 group-hover:text-indigo-600 transition-colors">
                Trip Buddy
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

      {/* Main Content Area */}
      <main className="flex-1 pt-8 pb-16 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-4xl border border-slate-100 p-8 md:p-12 shadow-sm">
          <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
              <p>
                When you use Trip Buddy, we collect information that you provide to us, such as your name, email address, 
                and travel preferences. We also collect data about the trips you generate and your interactions with our AI.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
              <p>
                We use your information to provide our services, personalize your travel itineraries, 
                and improve our AI models. We do not sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. However, no method 
                of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Third-Party Services</h2>
              <p>
                We use Secure Cloud Infrastructure for secure login services and database management, and Advanced Artificial Intelligence systems 
                for itinerary generation. These services have their own security standards.
              </p>
            </section>

            <section className="pt-8 border-t border-slate-100">
              <p className="text-sm font-medium">Last updated: May 2026</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
