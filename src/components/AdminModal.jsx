import React, { useState, useEffect } from 'react';
import CategoriaSelector from './CategoriaSelector';

const AdminModal = ({ isOpen, onClose, type, onSave, editingItem, categorias = [] }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: '',
    descricao: '',
    conteudo: '',
    autor: 'Administrador',
    destaque: false,
    tags: [],
    logo_url: ''
  });
  
  const [file, setFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [fileValidation, setFileValidation] = useState({ isValid: true, errors: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validação básica
      const validTypes = ['.pdf', '.ppt', '.pptx'];
      const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        setFileValidation({ 
          isValid: false, 
          errors: ['Formato de arquivo não suportado. Use PDF, PPT ou PPTX.'] 
        });
        setFile(null);
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
        setFileValidation({ 
          isValid: false, 
          errors: ['Arquivo muito grande. Máximo 10MB.'] 
        });
        setFile(null);
        return;
      }
      
      setFileValidation({ isValid: true, errors: [] });
      setFile(selectedFile);
      
      // Auto-detectar tipo baseado na extensão
      const tipo = fileExtension === '.pdf' ? 'PDF' : 'PPT';
      handleInputChange('tipo', tipo);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (type === 'treinamento' && !file) {
      alert('Por favor, selecione um arquivo para o treinamento.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await onSave(formData, file);
      
      if (success) {
        // Reset form
        setFormData({
          titulo: '',
          categoria: '',
          descricao: '',
          conteudo: '',
          autor: 'Administrador',
          destaque: false,
          tags: [],
          logo_url: ''
        });
        setFile(null);
        setTagInput('');
        setFileValidation({ isValid: true, errors: [] });
        
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTraining = type === 'treinamento';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {isTraining ? 'Adicionar Treinamento' : 'Adicionar Notícia'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              placeholder={isTraining ? 'Nome do treinamento' : 'Título da notícia'}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria *
            </label>
            <CategoriaSelector
              value={formData.categoria}
              onChange={(categoria) => handleInputChange('categoria', categoria)}
              tipo={isTraining ? 'treinamentos' : 'noticias'}
              allowCreate={isTraining} // Apenas treinamentos podem criar novas categorias
              required={true}
              className="w-full"
            />
          </div>

          {/* Upload de arquivo (apenas para treinamentos) */}
          {isTraining && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivo (PPT/PDF) *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Clique para selecionar um arquivo ou arraste aqui
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos aceitos: PDF, PPT, PPTX (máx. 10MB)
                  </p>
                </label>
              </div>

              {file && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <svg className="text-green-600 mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-green-800">{file.name}</span>
                  <svg className="text-green-600 ml-auto w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}

              {!fileValidation.isValid && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <svg className="text-red-600 mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-red-800">Arquivo inválido:</span>
                  </div>
                  <ul className="text-sm text-red-700 list-disc list-inside">
                    {fileValidation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Descrição/Conteúdo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isTraining ? 'Descrição' : 'Conteúdo'} *
            </label>
            <textarea
              value={isTraining ? formData.descricao : formData.conteudo}
              onChange={(e) => handleInputChange(isTraining ? 'descricao' : 'conteudo', e.target.value)}
              placeholder={isTraining ? 'Descrição do treinamento' : 'Conteúdo da notícia'}
              className="w-full p-3 border border-gray-300 rounded-md resize-none h-32"
              required
            />
          </div>

          {/* Tags (apenas para treinamentos) */}
          {isTraining && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Digite uma tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button 
                  type="button" 
                  onClick={handleAddTag}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Autor (apenas para notícias) */}
          {!isTraining && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autor
              </label>
              <input
                type="text"
                value={formData.autor}
                onChange={(e) => handleInputChange('autor', e.target.value)}
                placeholder="Nome do autor"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          )}

          {/* Destaque (apenas para notícias) */}
          {!isTraining && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="destaque"
                checked={formData.destaque}
                onChange={(e) => handleInputChange('destaque', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="destaque" className="text-sm font-medium text-gray-700">
                Marcar como destaque
              </label>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || (isTraining && !fileValidation.isValid)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminModal;

