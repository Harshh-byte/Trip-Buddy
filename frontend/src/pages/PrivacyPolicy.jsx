import SEO from '../components/shared/SEO';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-6 font-sans">
      <SEO title="Privacy Policy" description="How we protect your data at Trip Buddy." />
      
      <div className="max-w-3xl mx-auto">
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
    </div>
  );
};

export default PrivacyPolicy;
