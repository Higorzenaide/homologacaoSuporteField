import React from 'react';
import { createPortal } from 'react-dom';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar ação", 
  message = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger" // "danger" ou "warning"
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const getButtonStyles = () => {
    if (type === "danger") {
      return "bg-red-600 hover:bg-red-700 text-white";
    }
    return "bg-yellow-600 hover:bg-yellow-700 text-white";
  };

  const modalContent = (
    <div 
      className="fixed top-0 left-0 w-full h-full bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        inset: 0
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100"
        style={{ margin: 'auto' }}
      >
        {/* Header Melhorado */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex items-center">
            {type === "danger" ? (
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            ) : (
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            )}
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Body Melhorado */}
        <div className="px-6 py-6">
          <p className="text-base text-gray-700 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer Melhorado */}
        <div className="px-6 py-6 bg-gray-50 flex justify-end space-x-4 rounded-b-2xl">
          <button
            onClick={handleCancel}
            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-3 text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${getButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  // Usar createPortal para renderizar o modal no body, fora da hierarquia atual
  return createPortal(modalContent, document.body);
};

export default ConfirmModal;