import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configurar worker do PDF.js com fallback
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const PDFViewer = ({ isOpen, onClose, pdfUrl, title }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNumPages(null);
      setPageNumber(1);
      setScale(1.0);
      setLoading(true);
      setError(null);
    }
  }, [isOpen, pdfUrl]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Erro ao carregar PDF:', error);
    setError('Erro ao carregar o arquivo PDF');
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const handleClose = () => {
    setPageNumber(1);
    setScale(1.0);
    setLoading(true);
    setError(null);
    setNumPages(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 truncate">
            {title || 'Visualizador de PDF'}
          </h2>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
              >
                Baixar
              </a>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {pageNumber} de {numPages || '?'}
            </span>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Próxima →
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
            >
              -
            </button>
            <span className="text-sm text-gray-700 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
            >
              +
            </button>
            <button
              onClick={resetZoom}
              className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex justify-center">
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Carregando PDF...</div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-600 text-lg mb-2">⚠️ Erro</div>
                  <div className="text-gray-600">{error}</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            )}

            {pdfUrl && !error && (
              <Document
                file={{
                  url: pdfUrl,
                  httpHeaders: {
                    'Access-Control-Allow-Origin': '*',
                  },
                  withCredentials: false
                }}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                options={{
                  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                  cMapPacked: true,
                  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
                }}
                loading={
                  <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Carregando PDF...</div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="text-red-600 text-lg mb-2">⚠️ Erro</div>
                      <div className="text-gray-600">Não foi possível carregar o PDF</div>
                      <div className="text-sm text-gray-500 mt-2">URL: {pdfUrl}</div>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  loading={
                    <div className="flex items-center justify-center h-64">
                      <div className="text-lg text-gray-600">Carregando página...</div>
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="text-red-600 text-lg mb-2">⚠️ Erro</div>
                        <div className="text-gray-600">Erro ao carregar a página</div>
                      </div>
                    </div>
                  }
                  className="shadow-lg"
                />
              </Document>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Use os controles acima para navegar e ajustar o zoom
            </div>
            <div>
              Pressione ESC para fechar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;

