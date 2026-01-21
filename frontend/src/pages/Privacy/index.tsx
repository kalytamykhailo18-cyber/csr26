// CSR26 Privacy Policy Page
// GDPR compliant privacy policy for the Impact Processing service
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

const PrivacyPage = () => {
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
              Privacy Policy
            </h1>
            <p className="text-gray-500">Last updated: January 2026</p>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none space-y-8 animate-fade-up-normal">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                1. Data Controller
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Data is collected to manage plastic footprint neutralization transactions
                and the issuance of related certificates. The data controller is responsible
                for ensuring that your personal information is processed in accordance with
                applicable data protection laws.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                2. Data Collected
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We collect only the data necessary for the provision of the service:
              </p>

              {/* Data Types Table */}
              <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Data Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Personal Data (Name, Surname, Email)
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        For CSR/ESG certificate registration
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Transaction Data (Amount, Kg of plastic removed)
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        For processing and certification
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Security Note */}
              <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-100">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Payment Security
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      We do not store complete credit card data. All payment information
                      is handled entirely by our payment processors (Stripe/PayPal) using
                      industry-standard encryption and security protocols.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                3. Purpose of Processing and Sharing with Third Parties
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                User data is processed for:
              </p>

              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Payment and Order Processing</p>
                    <p className="text-gray-600 text-sm">
                      To complete your transaction and register your environmental asset.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Certification</p>
                    <p className="text-gray-600 text-sm">
                      Strictly necessary data (Name and Kg offset) may be shared with
                      partner certification registries (e.g., Corsair Group / Control Union)
                      solely for the purpose of ensuring the traceability and invulnerability
                      of ESG data.
                    </p>
                  </div>
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                4. User Rights (GDPR)
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                In accordance with GDPR, you have the right to:
              </p>

              {/* Rights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="font-medium text-gray-800">Right of Access</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Request access to your personal data.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="font-medium text-gray-800">Right of Rectification</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Request correction of inaccurate data.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="font-medium text-gray-800">Right of Erasure</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Request deletion of your personal data.*
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="font-medium text-gray-800">Right of Portability</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Request a copy of your data in a portable format.
                  </p>
                </div>
              </div>

              {/* Exception Note */}
              <div className="mt-4 p-4 bg-yellow-50 rounded-md border border-yellow-100">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      *Important Exception
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Data related to already issued environmental certificates must be retained
                      to ensure traceability in the public registry and guarantee their validity.
                      This is required to maintain the integrity and audit trail of ESG certifications.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section className="pt-8 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed">
                For any questions regarding this privacy policy or to exercise your rights,
                please contact us at:{' '}
                <a
                  href="mailto:privacy@impactcsr26.it"
                  className="text-blue-600 hover:underline"
                >
                  privacy@impactcsr26.it
                </a>
              </p>
            </section>

            {/* GDPR Compliance Badge */}
            <section className="pt-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-md border border-blue-100">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-blue-800">GDPR Compliant</p>
                  <p className="text-sm text-blue-700">
                    This service complies with the General Data Protection Regulation (EU) 2016/679.
                  </p>
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

export default PrivacyPage;
