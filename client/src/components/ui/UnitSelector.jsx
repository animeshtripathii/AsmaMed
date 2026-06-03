/**
 * client/src/components/ui/UnitSelector.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * UNIT SELECTOR DROPDOWN (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { getAvailableUnits } from '@/utils/unitConverter';

const UnitSelector = ({
  unitType,
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const units        = getAvailableUnits(unitType);
  const isCount      = unitType === 'count';
  const isDisabled   = disabled || isCount;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isDisabled}
      className={`
        rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
        text-gray-700 shadow-sm
        focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
        disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400
        ${className}
      `}
    >
      {units.map((unit) => (
        <option key={unit} value={unit}>
          {unit}
        </option>
      ))}
    </select>
  );
};

export default UnitSelector;
