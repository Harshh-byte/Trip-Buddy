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
              <span className="font-black text-base tracking-tighter text-slate-900 group-hover:text-indigo-600 transition-colors">
                Trip Buddy
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
                By accessing or using Trip Buddy, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily use the platform for personal, non-commercial 
                trip generation and planning purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. AI-Generated Content</h2>
              <p>
                Trip Buddy uses AI to generate travel itineraries. While we strive for accuracy, 
                we are not responsible for any errors, omissions, or the quality of the generated content. 
                Users should always verify travel details independently.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Account Responsibility</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Modifications</h2>
              <p>
                We reserve the right to modify or replace these terms at any time. Your continued 
                use of the platform constitutes acceptance of the new terms.
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

export default TermsOfService;
