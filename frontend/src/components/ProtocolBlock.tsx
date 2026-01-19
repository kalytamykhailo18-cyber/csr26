// CSR26 Protocol Block Component
// Explains the 80-week industrial cycle with popup for 5/45/50 rule
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import { useState } from 'react';
import Tooltip from '@mui/material/Tooltip';

interface ProtocolBlockProps {
  className?: string;
}

const ProtocolBlock = ({ className = '' }: ProtocolBlockProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const tooltipContent = (
    <div className="p-2">
      <p className="font-semibold mb-2">The 5/45/50 Rule:</p>
      <ul className="text-sm space-y-1">
        <li>5% immediate - This portion has already been removed</li>
        <li>45% at 40 weeks - Follows industrial processing cycle</li>
        <li>50% at 80 weeks - Final processing completion</li>
      </ul>
    </div>
  );

  return (
    <div className={`w-full bg-gray-100 rounded-md py-6 px-4 md:px-8 ${className}`}>
      <div className="max-w-3xl mx-auto text-center animate-zoom-in-normal">
        <p className="text-sm md:text-base text-gray-700">
          The CSR26 system follows an industrial generation model. Corsair issues plastic credits (CSR) based on its pyrolysis capacity. We don&apos;t sell promises, but digital assets that guarantee the certainty of physical waste removal within the{' '}
          <Tooltip
            title={tooltipContent}
            open={showTooltip}
            onOpen={() => setShowTooltip(true)}
            onClose={() => setShowTooltip(false)}
            arrow
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'white',
                  color: 'text.primary',
                  boxShadow: 2,
                  '& .MuiTooltip-arrow': {
                    color: 'white',
                  },
                  maxWidth: 320,
                  borderRadius: '6px',
                },
              },
            }}
          >
            <button
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              className="font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 cursor-pointer transition-colors"
            >
              80-week cycle
            </button>
          </Tooltip>
          .
        </p>
      </div>
    </div>
  );
};

export default ProtocolBlock;
