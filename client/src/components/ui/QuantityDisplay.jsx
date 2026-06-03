/**
 * client/src/components/ui/QuantityDisplay.jsx
 * Renders a formatted quantity with its unit.
 * Example output: "1.5 kg", "200 mL", "5000 count"
 */

import React from 'react';
import { formatQuantity } from '@/utils/formatters';

const QuantityDisplay = ({
  value,
  unit,
  className = '',
}) => {
  return (
    <span className={`text-gray-700 ${className}`}>
      {formatQuantity(value, unit)}
    </span>
  );
};

export default QuantityDisplay;
