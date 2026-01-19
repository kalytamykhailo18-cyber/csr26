// CSR26 Merchant Summary Cards Component
// Displays key metrics for merchant dashboard
// RULE: Use HTML + Tailwind for layout

import { formatEUR, formatWeightKg, formatNumber } from '../../utils/formatters';

interface SummaryCardsProps {
  totalImpactKg: number;
  totalAmount: number;
  transactionCount: number;
  customerCount: number;
  multiplier: number;
}

const SummaryCards = ({
  totalImpactKg,
  totalAmount,
  transactionCount,
  customerCount,
  multiplier,
}: SummaryCardsProps) => {
  const cards = [
    {
      title: 'Total Environmental Impact',
      value: formatWeightKg(totalImpactKg),
      subtitle: 'of plastic removed',
      color: 'green',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: 'Total Contribution',
      value: formatEUR(totalAmount),
      subtitle: 'in environmental fees',
      color: 'blue',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: 'Transactions',
      value: formatNumber(transactionCount),
      subtitle: 'environmental allocations',
      color: 'purple',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      title: 'Customers Engaged',
      value: formatNumber(customerCount),
      subtitle: 'unique participants',
      color: 'orange',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
  ];

  const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      text: 'text-green-600',
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-600',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      text: 'text-purple-600',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      text: 'text-orange-600',
    },
  };

  return (
    <div className="space-y-4">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const colors = colorClasses[card.color];
          return (
            <div
              key={card.title}
              className="bg-white rounded-md border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-2 rounded-md ${colors.bg}`}>
                  <span className={colors.icon}>{card.icon}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multiplier Info */}
      <div className="bg-blue-50 rounded-md p-4 flex items-center gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-sm text-blue-800">
          Your current multiplier is <strong>{multiplier}x</strong>. This amplifies the
          environmental impact shown to your customers.
        </p>
      </div>
    </div>
  );
};

export default SummaryCards;
