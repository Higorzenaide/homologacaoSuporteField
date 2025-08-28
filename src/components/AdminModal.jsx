import React, { useState, useEffect, useRef } from 'react';
import CategoriaSelector from './CategoriaSelector';
import QuestionarioModal from './QuestionarioModal';
import NotificationTargetSelector from './NotificationTargetSelector';
import useNotificationSelector from '../hooks/useNotificationSelector';
import notificationService from '../services/notificationService';

const AdminModal = ({ isOpen, onClose, type, onSave, editingItem, categorias = [] }) => {
  const {
    isNotificationSelectorOpen,
    notificationConfig,
    openNotificationSelector,
    closeNotificationSelector,
    handleNotificationConfirm
  } = useNotificationSelector();
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: '',
    descricao: '',
    conteudo: '',
    autor: 'Administrador',
    destaque: false,
    tags: [],
    logo_url: '',
    obrigatorio: false,
    prazo_limite: '',
    criarQuestionario: false,
    enviarNotificacao: true,
    tipoNotificacao: 'selected' // 'all', 'selected', 'none'
  });
  
  const [file, setFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [fileValidation, setFileValidation] = useState({ isValid: true, errors: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionarioModal, setShowQuestionarioModal] = useState(false);
  const [questionarioData, setQuestionarioData] = useState(null);
  const [selectedNotificationUsers, setSelectedNotificationUsers] = useState([]);
  const editorRef = useRef(null);

  // Carregar dados do item em edição
  useEffect(() => {
    if (editingItem) {
      setFormData({
        titulo: editingItem.titulo || '',
        categoria: editingItem.categoria_nome || editingItem.categoria || '',
        descricao: editingItem.descricao || '',
        conteudo: editingItem.conteudo || '',
        autor: editingItem.autor || 'Administrador',
        destaque: editingItem.destaque || false,
        tags: editingItem.tags || [],
        logo_url: editingItem.logo_url || '',
        obrigatorio: editingItem.obrigatorio || false,
        prazo_limite: editingItem.prazo_limite || '',
        enviarNotificacao: false, // Para edição, não enviar notificação por padrão
        tipoNotificacao: 'none'
      });
    } else {
      // Reset form para novo item
      setFormData({
        titulo: '',
        categoria: '',
        descricao: '',
        conteudo: '',
        autor: 'Administrador',
        destaque: false,
        tags: [],
        logo_url: '',
        obrigatorio: false,
        prazo_limite: '',
        criarQuestionario: false,
        enviarNotificacao: true,
        tipoNotificacao: 'selected'
      });
    }
    setFile(null);
    setTagInput('');
    setSelectedNotificationUsers([]);
    setFileValidation({ isValid: true, errors: [] });
    setQuestionarioData(null);
    setShowQuestionarioModal(false);
  }, [editingItem, isOpen]);

  // Configurar editor quando abrir
  useEffect(() => {
    if (isOpen && !isTraining && editorRef.current) {
      // Garantir direção LTR (esquerda para direita)
      editorRef.current.style.direction = 'ltr';
      editorRef.current.style.textAlign = 'left';
      
      // Definir conteúdo inicial se estiver editando
      if (editingItem && formData.conteudo) {
        editorRef.current.innerHTML = formData.conteudo;
      }
    }
  }, [isOpen, editingItem, formData.conteudo]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funções do editor rico
  const formatText = (command, value = null) => {
    // Focar no editor primeiro
    editorRef.current.focus();
    
    // Aplicar comando
    document.execCommand(command, false, value);
    
    // Manter foco e atualizar conteúdo
    editorRef.current.focus();
    handleEditorInput();
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      handleInputChange('conteudo', editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Digite a URL do link:');
    if (url) {
      formatText('createLink', url);
    }
  };

  const changeTextColor = (color) => {
    formatText('foreColor', color);
  };

  const changeFontSize = (size) => {
    if (size) {
      formatText('fontSize', size);
    }
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

  const handleNotifications = async (savedData) => {
    try {
      let userIds = null;
      
      switch (formData.tipoNotificacao) {
        case 'all':
          // null significa todos os usuários ativos (comportamento padrão)
          userIds = null;
          break;
        case 'selected':
          userIds = selectedNotificationUsers;
          break;
        case 'none':
          return; // Não enviar notificações
      }

      if (type === 'treinamento') {
        await notificationService.notifyNewTreinamento(savedData, userIds);
      } else if (type === 'noticia') {
        await notificationService.notifyNewNoticia(savedData, userIds);
      }
      
      console.log(`✅ Notificações enviadas com sucesso para ${userIds ? userIds.length : 'todos os'} usuários`);
    } catch (error) {
      console.error('❌ Erro ao enviar notificações:', error);
      // Não falhar o processo de criação por erro de notificação
    }
  };

  const handleSelectNotificationUsers = () => {
    const config = {
      title: `Selecionar Usuários para ${type === 'treinamento' ? 'Treinamento' : 'Notícia'}`,
      subtitle: `Escolha quais usuários devem ser notificados sobre ${type === 'treinamento' ? 'este treinamento' : 'esta notícia'}`
    };
    
    openNotificationSelector((selectedUserIds) => {
      setSelectedNotificationUsers(selectedUserIds);
      handleInputChange('tipoNotificacao', 'selected');
    }, config);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (type === 'treinamento' && !file && !editingItem) {
      alert('Por favor, selecione um arquivo para o treinamento.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Salvar treinamento primeiro
      const success = await onSave(formData, file, questionarioData);
      
      if (success && success.data) {
        // Enviar notificações se solicitado
        if (formData.enviarNotificacao && formData.tipoNotificacao !== 'none') {
          await handleNotifications(success.data);
        }
        // Reset form
        setFormData({
          titulo: '',
          categoria: '',
          descricao: '',
          conteudo: '',
          autor: 'Administrador',
          destaque: false,
          tags: [],
          logo_url: '',
          obrigatorio: false,
          prazo_limite: '',
          criarQuestionario: false,
          enviarNotificacao: true,
          tipoNotificacao: 'selected'
        });
        setFile(null);
        setTagInput('');
        setSelectedNotificationUsers([]);
        setFileValidation({ isValid: true, errors: [] });
        setQuestionarioData(null);
        
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestionarioSave = (questionario) => {
    setQuestionarioData(questionario);
    setShowQuestionarioModal(false);
    setFormData(prev => ({ ...prev, criarQuestionario: true }));
  };

  const isTraining = type === 'treinamento';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingItem 
              ? (isTraining ? 'Editar Treinamento' : 'Editar Notícia')
              : (isTraining ? 'Adicionar Treinamento' : 'Adicionar Notícia')
            }
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
              allowCreate={isTraining}
              required={true}
              className="w-full"
            />
          </div>

          {/* Upload de arquivo (apenas para treinamentos) */}
          {isTraining && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivo (PPT/PDF) {!editingItem && '*'}
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
                  {editingItem && (
                    <p className="text-xs text-blue-600 mt-1">
                      Deixe vazio para manter o arquivo atual
                    </p>
                  )}
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

          {/* Descrição (para treinamentos) ou Conteúdo (para notícias) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isTraining ? 'Descrição' : 'Conteúdo'} *
            </label>
            
            {isTraining ? (
              // Para treinamentos, manter textarea simples
              <textarea
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descrição do treinamento"
                className="w-full p-3 border border-gray-300 rounded-md resize-none h-32 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            ) : (
              // Para notícias, usar editor rico simples
              <div className="border border-gray-300 rounded-md">
                {/* Toolbar do editor */}
                <div className="border-b border-gray-300 p-2 bg-gray-50 flex flex-wrap gap-1">
                  {/* Formatação básica */}
                  <button
                    type="button"
                    onClick={() => formatText('bold')}
                    className="p-2 hover:bg-gray-200 rounded border"
                    title="Negrito"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('italic')}
                    className="p-2 hover:bg-gray-200 rounded border"
                    title="Itálico"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('underline')}
                    className="p-2 hover:bg-gray-200 rounded border"
                    title="Sublinhado"
                  >
                    <u>U</u>
                  </button>
                  
                  <div className="w-px bg-gray-300 mx-1"></div>
                  
                  {/* Tamanhos de fonte */}
                  <select
                    onChange={(e) => changeFontSize(e.target.value)}
                    className="p-1 border rounded text-sm"
                    defaultValue=""
                  >
                    <option value="">Tamanho</option>
                    <option value="1">Pequeno</option>
                    <option value="3">Normal</option>
                    <option value="5">Grande</option>
                    <option value="7">Muito Grande</option>
                  </select>
                  
                  <div className="w-px bg-gray-300 mx-1"></div>
                  
                  {/* Cores */}
                  <button
                    type="button"
                    onClick={() => changeTextColor('#dc2626')}
                    className="w-8 h-8 bg-red-600 rounded border hover:opacity-80"
                    title="Vermelho"
                  ></button>
                  <button
                    type="button"
                    onClick={() => changeTextColor('#059669')}
                    className="w-8 h-8 bg-green-600 rounded border hover:opacity-80"
                    title="Verde"
                  ></button>
                  <button
                    type="button"
                    onClick={() => changeTextColor('#2563eb')}
                    className="w-8 h-8 bg-blue-600 rounded border hover:opacity-80"
                    title="Azul"
                  ></button>
                  <button
                    type="button"
                    onClick={() => changeTextColor('#000000')}
                    className="w-8 h-8 bg-black rounded border hover:opacity-80"
                    title="Preto"
                  ></button>
                  
                  <div className="w-px bg-gray-300 mx-1"></div>
                  
                  {/* Listas */}
                  <button
                    type="button"
                    onClick={() => formatText('insertUnorderedList')}
                    className="p-2 hover:bg-gray-200 rounded border text-sm"
                    title="Lista com marcadores"
                  >
                    • Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('insertOrderedList')}
                    className="p-2 hover:bg-gray-200 rounded border text-sm"
                    title="Lista numerada"
                  >
                    1. Lista
                  </button>
                  
                  <div className="w-px bg-gray-300 mx-1"></div>
                  
                  {/* Link */}
                  <button
                    type="button"
                    onClick={insertLink}
                    className="p-2 hover:bg-gray-200 rounded border text-sm"
                    title="Inserir link"
                  >
                    🔗 Link
                  </button>
                  
                  {/* Limpar formatação */}
                  <button
                    type="button"
                    onClick={() => formatText('removeFormat')}
                    className="p-2 hover:bg-gray-200 rounded border text-sm"
                    title="Limpar formatação"
                  >
                    🧹 Limpar
                  </button>
                </div>
                
                {/* Área de edição */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  className="p-3 min-h-[200px] focus:outline-none"
                  style={{ 
                    minHeight: '200px',
                    direction: 'ltr',
                    textAlign: 'left',
                    unicodeBidi: 'embed'
                  }}
                  suppressContentEditableWarning={true}
                />
                
                {/* Placeholder customizado */}
                {!formData.conteudo && (
                  <div 
                    className="absolute pointer-events-none text-gray-400 p-3"
                    style={{ 
                      top: '60px', 
                      left: '0',
                      direction: 'ltr',
                      textAlign: 'left'
                    }}
                  >
                    Digite o conteúdo da notícia...
                  </div>
                )}
              </div>
            )}
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

          {/* Configurações de Treinamento Obrigatório (apenas para treinamentos) */}
          {isTraining && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900">Configurações de Treinamento</h3>
              
              {/* Checkbox para treinamento obrigatório */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="obrigatorio"
                  checked={formData.obrigatorio}
                  onChange={(e) => handleInputChange('obrigatorio', e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="obrigatorio" className="text-sm font-medium text-gray-700">
                  Treinamento Obrigatório
                </label>
              </div>
              
              {/* Campo de prazo limite (aparece apenas se obrigatório) */}
              {formData.obrigatorio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prazo Limite (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.prazo_limite}
                    onChange={(e) => handleInputChange('prazo_limite', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se definido, os usuários receberão lembretes automáticos sobre este treinamento
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Seção de Questionário (apenas para treinamentos) */}
          {isTraining && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Questionário de Avaliação</span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Crie um questionário para avaliar o conhecimento dos usuários após o treinamento
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="criarQuestionario"
                    checked={formData.criarQuestionario || questionarioData !== null}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setQuestionarioData(null);
                      }
                      handleInputChange('criarQuestionario', e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="criarQuestionario" className="text-sm font-medium text-gray-700">
                    Criar Questionário
                  </label>
                </div>
              </div>

              {/* Mostrar informações do questionário se já foi configurado */}
              {questionarioData && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Questionário Configurado</h4>
                    <button
                      type="button"
                      onClick={() => setShowQuestionarioModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Editar</span>
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Título:</strong> {questionarioData.titulo}</p>
                    {questionarioData.descricao && (
                      <p><strong>Descrição:</strong> {questionarioData.descricao}</p>
                    )}
                    <p><strong>Perguntas:</strong> {questionarioData.perguntas?.length || 0}</p>
                    <p><strong>Obrigatório:</strong> {questionarioData.obrigatorio ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
              )}

              {/* Botão para configurar questionário */}
              {(formData.criarQuestionario || questionarioData !== null) && !questionarioData && (
                <button
                  type="button"
                  onClick={() => setShowQuestionarioModal(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Configurar Questionário</span>
                </button>
              )}

              {questionarioData && (
                <button
                  type="button"
                  onClick={() => setShowQuestionarioModal(true)}
                  className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2 border border-blue-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Editar Questionário</span>
                </button>
              )}
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
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="destaque" className="text-sm font-medium text-gray-700">
                Marcar como destaque
              </label>
            </div>
          )}

          {/* Configurações de Notificação */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17H4l5 5v-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
              </svg>
              <span>Configurações de Notificação</span>
            </h3>
            
            {/* Checkbox para enviar notificação */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enviarNotificacao"
                checked={formData.enviarNotificacao}
                onChange={(e) => handleInputChange('enviarNotificacao', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="enviarNotificacao" className="text-sm font-medium text-gray-700">
                Enviar notificação aos usuários
              </label>
            </div>
            
            {/* Opções de tipo de notificação */}
            {formData.enviarNotificacao === true && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Quem deve receber a notificação?</p>
                
                <div className="space-y-2">
                  {/* Todos os usuários */}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoNotificacao"
                      value="all"
                      checked={formData.tipoNotificacao === 'all'}
                      onChange={(e) => handleInputChange('tipoNotificacao', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Todos os usuários ativos</span>
                  </label>
                  
                  {/* Usuários selecionados */}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoNotificacao"
                      value="selected"
                      checked={formData.tipoNotificacao === 'selected'}
                      onChange={(e) => handleInputChange('tipoNotificacao', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Usuários específicos 
                      {selectedNotificationUsers.length > 0 && (
                        <span className="text-blue-600 font-medium ml-1">
                          ({selectedNotificationUsers.length} selecionados)
                        </span>
                      )}
                    </span>
                  </label>
                  
                  {/* Nenhuma notificação */}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoNotificacao"
                      value="none"
                      checked={formData.tipoNotificacao === 'none'}
                      onChange={(e) => handleInputChange('tipoNotificacao', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Não enviar notificações</span>
                  </label>
                </div>
                
                {/* Botão para selecionar usuários */}
                {formData.tipoNotificacao === 'selected' && (
                  <button
                    type="button"
                    onClick={handleSelectNotificationUsers}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    {selectedNotificationUsers.length > 0 
                      ? `Alterar Seleção (${selectedNotificationUsers.length} usuários)`
                      : 'Selecionar Usuários'
                    }
                  </button>
                )}
                
                {/* Resumo da economia de processamento */}
                {(formData.tipoNotificacao === 'selected' && selectedNotificationUsers.length > 0) || formData.tipoNotificacao === 'none' ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-green-800 font-medium">Economia de Processamento</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {formData.tipoNotificacao === 'none' 
                        ? 'Nenhuma notificação será enviada, economizando 100% do processamento.'
                        : `Notificações serão enviadas apenas para ${selectedNotificationUsers.length} usuários selecionados.`
                      }
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || (isTraining && !editingItem && !fileValidation.isValid)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Salvando...' : (editingItem ? 'Atualizar' : 'Salvar')}
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

      {/* Modal de Questionário */}
      {showQuestionarioModal && (
        <QuestionarioModal
          isOpen={showQuestionarioModal}
          onClose={() => setShowQuestionarioModal(false)}
          treinamentoId={null} // Será definido após salvar o treinamento
          questionarioExistente={questionarioData}
          onSave={handleQuestionarioSave}
        />
      )}

      {/* Modal de Seleção de Usuários para Notificação */}
      <NotificationTargetSelector
        isOpen={isNotificationSelectorOpen}
        onClose={closeNotificationSelector}
        onConfirm={handleNotificationConfirm}
        title={notificationConfig.title}
        subtitle={notificationConfig.subtitle}
      />
    </div>
  );
};

export default AdminModal;