import { Link } from 'react-router-dom';
import { Plane } from 'lucide-react';
import SEO from '../components/shared/SEO';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-slate-50/30 font-sans flex flex-col">
      <SEO title="Terms of Service" description="Rules and guidelines for using Trip Buddy." />
      
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
              Terms of Service
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
          <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Terms of Service</h1>
          
          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Trip Buddy, you agree to be bound by these Terms of Service, 
                our Privacy Policy, and all applicable laws and regulations. If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily use the platform for personal, non-commercial 
                trip generation and planning purposes. You may not modify, distribute, or copy materials from this site for commercial purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. AI-Generated Content & Disclaimers</h2>
              <p>
                Trip Buddy uses advanced artificial intelligence to generate travel itineraries. While we strive to provide helpful and accurate planning recommendations, 
                we do not guarantee the accuracy, availability, operating hours, prices, safety, or suitability of any suggested flights, hotels, restaurants, or attractions. 
              </p>
              <p className="mt-2">
                All itineraries are provided for informational and convenience purposes only. Users must verify all booking details, bookings, schedules, and travel advisories independently before initiating travel.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. User Account & Conduct</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities that occur under your account. 
              </p>
              <p className="mt-2">
                You agree not to use the platform to:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Attempt to scrape, reverse engineer, or exploit the platform or the underlying AI generation systems.</li>
                <li>Generate malicious, abusive, or inappropriate query content.</li>
                <li>Impersonate others or create unauthorized accounts.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Limitation of Liability</h2>
              <p>
                In no event shall Trip Buddy, its creators, or partners be liable for any direct, indirect, incidental, special, or consequential damages (including, without limitation, travel cancellations, personal injury, property damage, financial loss, or scheduling errors) arising out of the use or inability to use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Modifications to Service & Terms</h2>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the service, or replace these terms at any time. Your continued 
                use of the platform constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">7. Contact Information</h2>
              <p>
                For any questions regarding these Terms of Service, please contact us at:
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                legal@tripbuddy.io
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

export default TermsOfService;
