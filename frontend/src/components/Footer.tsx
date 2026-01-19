// CSR26 Footer Component
// Displays logos, ESG note, and legal links
// RULE: Use HTML + Tailwind for layout, NOT MUI Box/Grid/Stack
// RULE: Navigation via useNavigation hook, NO Link/a tags

import { useNavigation } from '../hooks/useNavigation';

interface FooterProps {
  className?: string;
}

const Footer = ({ className = '' }: FooterProps) => {
  const { goTo } = useNavigation();

  const handlePrivacyClick = () => {
    goTo('/privacy');
  };

  const handleTermsClick = () => {
    goTo('/terms');
  };

  return (
    <footer className={`w-full bg-gray-900 py-8 px-4 md:px-8 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {/* Logos Section */}
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 mb-6 animate-fade-up-fast">
          {/* CSR26 Logo */}
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">CSR26</span>
          </div>

          {/* Separator */}
          <div className="hidden md:block h-8 w-px bg-gray-600" />

          {/* Control Union Logo Placeholder */}
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-400">Control Union</span>
          </div>

          {/* Separator */}
          <div className="hidden md:block h-8 w-px bg-gray-600" />

          {/* CPRS Verified Logo Placeholder */}
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-400">CPRS Verified</span>
          </div>
        </div>

        {/* ESG Note */}
        <div className="text-center mb-6 animate-fade-up-normal">
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            The CPRS protocol is verified by Control Union and complies with the EU directives on sustainability reporting (CSRD - Legislative Decree 125/2024). The generated assets are auditable, bankable, and valid for improving the ESG Rating.
          </p>
        </div>

        {/* Legal Links */}
        <div className="flex justify-center items-center gap-4 animate-fade-up-light-slow">
          <button
            type="button"
            onClick={handlePrivacyClick}
            className="text-sm text-gray-400 hover:text-white hover:underline transition-colors"
          >
            Privacy Policy
          </button>
          <span className="text-gray-600">|</span>
          <button
            type="button"
            onClick={handleTermsClick}
            className="text-sm text-gray-400 hover:text-white hover:underline transition-colors"
          >
            Terms and Conditions
          </button>
        </div>

        {/* Copyright */}
        <div className="text-center mt-6 animate-fade-up-slow">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} CSR26. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
