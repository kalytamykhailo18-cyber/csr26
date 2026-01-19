// CSR26 Progress Bar Component
// Shows progress towards €10 certification threshold
// RULE: Use HTML + Tailwind for layout

import { formatEUR, formatPercentage } from '../../utils/formatters';

interface ProgressBarProps {
  progress: number; // 0-100
  currentAmount: number;
  threshold: number;
}

const ProgressBar = ({ progress, currentAmount, threshold }: ProgressBarProps) => {
  const remaining = threshold - currentAmount;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="bg-white rounded-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Progress to Certification
          </h3>
          <p className="text-sm text-gray-500">
            Reach {formatEUR(threshold)} to certify your environmental assets
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-blue-600">
            {formatPercentage(clampedProgress, 0)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="overflow-hidden h-4 rounded-md bg-gray-200">
          <div
            style={{ width: `${clampedProgress}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out rounded-md"
          />
        </div>

        {/* Markers */}
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">{formatEUR(0)}</span>
          <span className="text-xs text-gray-500">{formatEUR(threshold / 2)}</span>
          <span className="text-xs text-gray-500">{formatEUR(threshold)}</span>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <div className="flex items-start gap-3">
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
          <div>
            <p className="text-sm text-blue-800">
              {remaining > 0 ? (
                <>
                  You have accumulated <strong>{formatEUR(currentAmount)}</strong>.
                  Contribute <strong>{formatEUR(remaining)}</strong> more to certify your
                  first environmental assets and unlock your auditable certificate.
                </>
              ) : (
                <>
                  Congratulations! You have reached the certification threshold.
                  Your environmental assets are now certified and auditable.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Milestone Badges */}
      <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
        {[
          { amount: 1, label: '€1' },
          { amount: 5, label: '€5' },
          { amount: threshold, label: `€${threshold}` },
        ].map((milestone) => (
          <div key={milestone.amount} className="text-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1 ${
                currentAmount >= milestone.amount
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {currentAmount >= milestone.amount ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span className="text-xs font-medium">{milestone.label}</span>
              )}
            </div>
            <span
              className={`text-xs ${
                currentAmount >= milestone.amount ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {milestone.amount === threshold ? 'Certified' : 'Reached'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
