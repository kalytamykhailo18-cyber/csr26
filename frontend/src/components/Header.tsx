// CSR26 Header Component
// Displays main title and subtitle from requirements.md
// RULE: Use HTML + Tailwind for layout, NOT MUI Box/Grid/Stack

interface HeaderProps {
  className?: string;
}

const Header = ({ className = '' }: HeaderProps) => {
  return (
    <header className={`w-full py-8 px-4 md:px-8 ${className}`}>
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Title */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 animate-fade-down-normal">
          Your environmental impact finally has a real value, just like the value and weight of every choice. Today, that weight has been removed from plastic.
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-gray-600 animate-fade-up-light-slow">
          Thanks to the CPRS protocol, we transform your contribution into an environmental asset that can reach certification. A guaranteed system that ensures the certainty of physical waste removal.
        </p>
      </div>
    </header>
  );
};

export default Header;
