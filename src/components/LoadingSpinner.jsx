import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Carregando...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Spinner principal */}
      <div className="relative">
        {/* Círculo externo */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}>
          <div className="absolute inset-0 border-4 border-transparent border-t-red-600 rounded-full animate-spin"></div>
        </div>
        
        {/* Círculo interno */}
        <div className={`absolute inset-2 border-2 border-gray-100 rounded-full animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
          <div className="absolute inset-0 border-2 border-transparent border-b-blue-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        
        {/* Ponto central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-gradient-to-r from-red-600 to-blue-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Texto de loading */}
      {text && (
        <div className="text-center">
          <p className={`${textSizes[size]} text-gray-600 font-medium animate-pulse`}>
            {text}
          </p>
          <div className="flex justify-center mt-2 space-x-1">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Variante para loading de página completa
export const FullPageLoader = ({ text = 'Carregando treinamentos...' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
      {/* Background animado */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-blue-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Conteúdo */}
      <div className="relative z-10 text-center">
        <LoadingSpinner size="xl" text={text} />
        
        {/* Logo ou ícone */}
        <div className="mt-8 mb-4">
          <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Portfólio Suporte Field</h2>
        <p className="text-gray-600">Preparando seus treinamentos...</p>
      </div>
    </div>
  );
};

// Variante para loading inline
export const InlineLoader = ({ text = 'Carregando...', className = '' }) => {
  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      <div className="w-6 h-6 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
      <span className="text-gray-600 text-sm">{text}</span>
    </div>
  );
};

// Variante para botões
export const ButtonLoader = ({ size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <div className={`${sizeClass} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
  );
};

export default LoadingSpinner;

