import React from 'react';

interface ReturnReasonSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'warranty', label: 'Warranty Exchange' },
  { value: 'change_of_mind', label: 'Change of Mind' },
  { value: 'other', label: 'Other' }
];

export const ReturnReasonSelect: React.FC<ReturnReasonSelectProps> = ({ value, onChange, disabled }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-[2px] focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
    >
      <option value="" disabled>Select Reason</option>
      {REASONS.map(reason => (
        <option key={reason.value} value={reason.value}>{reason.label}</option>
      ))}
    </select>
  );
};
