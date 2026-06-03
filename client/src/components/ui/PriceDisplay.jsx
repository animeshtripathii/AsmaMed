/**
 * client/src/components/ui/PriceDisplay.jsx
 * Renders a formatted price in ₹ per unit.
 * Example output: "₹450.00/kg"
 */

import React from 'react';
import { formatINR } from '@/utils/formatters';

const PriceDisplay = ({
  amountINR,
  perUnit,
  className = '',
}) => {
  const formattedAmount = formatINR(amountINR);
  const displayText     = perUnit ? `${formattedAmount}/${perUnit}` : formattedAmount;

  return (
    <span className={`font-semibold text-gray-900 ${className}`}>
      {displayText}
    </span>
  );
};

export default PriceDisplay;
