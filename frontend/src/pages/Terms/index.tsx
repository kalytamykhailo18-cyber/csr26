// CSR26 Terms and Conditions Page
// Legal terms for the Impact Processing service
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

const TermsPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white pt-14">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-down-fast">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Terms and Conditions
            </h1>
            <p className="text-gray-500">Last updated: January 2026</p>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none space-y-8 animate-fade-up-normal">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                1. Scope of Service
              </h2>
              <p className="text-gray-600 leading-relaxed">
                This site offers an "Impact Processing" service that allows companies and
                individuals to neutralize their plastic footprint by purchasing certified
                chemical recycling services. The service is provided in collaboration with
                Corsair Group International and certified by third-party organizations
                (e.g., Control Union).
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                2. Definition of "Environmental Asset"
              </h2>
              <p className="text-gray-600 leading-relaxed">
                The purchase does not constitute a physical product, but a digital
                Environmental Asset that certifies the physical removal of plastic waste
                from the environment. This asset represents proof of disposal through
                advanced pyrolysis processes. It is not a speculative financial instrument,
                but a sustainability service.
              </p>
            </section>

            {/* Section 3 - Vesting Rule */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                3. Vesting Rule (5/45/50)
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The user acknowledges and accepts that the industrial disposal process
                follows a technical timeline known as the "Vesting Rule":
              </p>

              {/* Vesting Timeline Visual */}
              <div className="bg-gray-50 rounded-md p-6 border border-gray-200">
                <div className="space-y-4">
                  {/* 5% Immediate */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">5%</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Immediate</p>
                      <p className="text-gray-600 text-sm">
                        Impact accrues upon confirmation of payment.
                      </p>
                    </div>
                  </div>

                  {/* 45% @ 40 weeks */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">45%</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Within 40 Weeks</p>
                      <p className="text-gray-600 text-sm">
                        Completion of the second phase of the industrial process.
                      </p>
                    </div>
                  </div>

                  {/* 50% @ 80 weeks */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">50%</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Within 80 Weeks</p>
                      <p className="text-gray-600 text-sm">
                        Final completion and certification closure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mt-4">
                Final certificates will be issued in accordance with these timelines.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                4. Payments and Refunds
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Payments are handled via secure gateways (Stripe/PayPal). Given the
                nature of the service, which immediately triggers irreversible industrial
                processes and resource allocation at partner facilities, refunds are not
                provided once the order has been processed and the environmental asset
                has been registered in the user's name.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                5. Limitation of Liability
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We act as a technological facilitator (Impact Processor) for access to
                recycling technology. We are not responsible for industrial delays due
                to force majeure that could alter the maturation timeframe, without
                prejudice to the contractual commitment to dispose of the purchased
                kilograms.
              </p>
            </section>

            {/* Certification Logos */}
            <section className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                Service certified by:
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 font-medium">Control Union</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-gray-700 font-medium">Corsair Group International</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TermsPage;
