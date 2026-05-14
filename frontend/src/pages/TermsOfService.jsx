import SEO from '../components/shared/SEO';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-6 font-sans">
      <SEO title="Terms of Service" description="Rules and guidelines for using Trip Buddy." />
      
      <div className="max-w-3xl mx-auto">
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
    </div>
  );
};

export default TermsOfService;
