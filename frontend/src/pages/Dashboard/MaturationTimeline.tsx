// CSR26 Maturation Timeline Component
// Visual timeline showing the 5/45/50 accrual rule
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import { formatWeightKg } from '../../utils/formatters';

interface MaturationEvent {
  amount: number;
  date: string;
}

interface MaturationTimelineProps {
  totalImpactKg: number;
  maturedImpactKg: number;
  pendingImpactKg: number;
  upcomingMaturations?: MaturationEvent[];
}

const MaturationTimeline = ({
  totalImpactKg,
  maturedImpactKg,
  pendingImpactKg,
  upcomingMaturations = [],
}: MaturationTimelineProps) => {
  // Calculate percentages
  const maturedPercent = totalImpactKg > 0 ? (maturedImpactKg / totalImpactKg) * 100 : 0;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate weeks from now
  const weeksFromNow = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffTime = date.getTime() - now.getTime();
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks > 0 ? diffWeeks : 0;
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Impact Maturation Timeline
        </h3>
        <p className="text-sm text-gray-500">
          Your environmental impact matures over time following the 5/45/50 rule
        </p>
      </div>

      {/* Maturation Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-600 font-medium">
            Matured: {formatWeightKg(maturedImpactKg)}
          </span>
          <span className="text-yellow-600 font-medium">
            Pending: {formatWeightKg(pendingImpactKg)}
          </span>
        </div>
        <div className="relative h-6 bg-gray-200 rounded-md overflow-hidden">
          {/* Matured portion */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
            style={{ width: `${maturedPercent}%` }}
          />
          {/* Progress indicator */}
          <div
            className="absolute top-0 h-full w-1 bg-green-700"
            style={{ left: `${maturedPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* 5/45/50 Rule Explanation */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* 5% Immediate */}
        <div className="text-center p-4 bg-green-50 rounded-md border border-green-100">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-sm">5%</span>
          </div>
          <p className="text-sm font-medium text-green-800">Immediate</p>
          <p className="text-xs text-green-600 mt-1">Available now</p>
        </div>

        {/* 45% Mid-term */}
        <div className="text-center p-4 bg-yellow-50 rounded-md border border-yellow-100">
          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-sm">45%</span>
          </div>
          <p className="text-sm font-medium text-yellow-800">Mid-term</p>
          <p className="text-xs text-yellow-600 mt-1">After 40 weeks</p>
        </div>

        {/* 50% Final */}
        <div className="text-center p-4 bg-blue-50 rounded-md border border-blue-100">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-sm">50%</span>
          </div>
          <p className="text-sm font-medium text-blue-800">Final</p>
          <p className="text-xs text-blue-600 mt-1">After 80 weeks</p>
        </div>
      </div>

      {/* Upcoming Maturations */}
      {upcomingMaturations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Upcoming Maturations
          </h4>
          <div className="space-y-3">
            {upcomingMaturations.map((maturation, index) => {
              const weeks = weeksFromNow(maturation.date);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        +{formatWeightKg(maturation.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(maturation.date)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {weeks > 0 ? `In ${weeks} week${weeks !== 1 ? 's' : ''}` : 'Soon'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
          <div>
            <p className="text-sm text-blue-800">
              <strong>Why does impact mature?</strong>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              The 5/45/50 rule ensures that plastic removal projects are completed
              responsibly over time. Your contribution funds ongoing environmental
              cleanup operations, with impact verified and certified at each stage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaturationTimeline;
