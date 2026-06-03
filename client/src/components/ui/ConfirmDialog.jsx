/**
 * src/components/ui/ConfirmDialog.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable confirm dialog modal.
 * Props:
 *   - isOpen: boolean to show/hide the modal
 *   - title: dialog title text
 *   - message: dialog message description
 *   - confirmLabel: text for the confirm button
 *   - confirmVariant: 'danger' | 'warning'
 *   - onConfirm: callback function when confirmed
 *   - onCancel: callback function when cancelled
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect } from 'react';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmButtonBg = confirmVariant === 'warning'
    ? 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500'
    : 'bg-red-500 hover:bg-red-600 focus:ring-red-500';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-2">{message}</p>
        
        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${confirmButtonBg} text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
