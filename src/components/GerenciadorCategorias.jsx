import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  ArrowUp, 
  ArrowDown,
  Settings,
  Tag,
  BarChart3
} from 'lucide-react';

// Serviços
import { 
  getTodasCategorias as getTreinamentoCategorias,
  criarCategoria as criarTreinamentoCategoria,
  atualizarCategoria as atualizarTreinamentoCategoria,
  desativarCategoria as desativarTreinamentoCategoria,
  reativarCategoria as reativarTreinamentoCategoria,
  reordenarCategorias as reordenarTreinamentoCategorias,
  getCategoriasComContagem as getTreinamentoCategoriasComContagem
} from '../services/categoriasTreinamentosService';

import { 
  getTodasCategorias as getNoticiasCategorias,
  atualizarCategoria as atualizarNoticiasCategoria,
  desativarCategoria as desativarNoticiasCategoria,
  reativarCategoria as reativarNoticiasCategoria,
  reordenarCategorias as reordenarNoticiasCategorias,
  getCategoriasComContagem as getNoticiasCategoriasComContagem
} from '../services/categoriasNoticiasService';

const GerenciadorCategorias = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('treinamentos');
  const [categoriasTreinamentos, setCategoriasTreinamentos] = useState([]);
  const [categoriasNoticias, setCategoriasNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#3B82F6'
  });

  const cores = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  useEffect(() => {
    if (isOpen) {
      carregarCategorias();
    }
  }, [isOpen]);

  const carregarCategorias = async () => {
    setLoading(true);
    try {
      const [treinamentos, noticias] = await Promise.all([
        getTreinamentoCategoriasComContagem(),
        getNoticiasCategoriasComContagem()
      ]);
      
      setCategoriasTreinamentos(treinamentos);
      setCategoriasNoticias(noticias);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.nome.trim()) return;
    
    try {
      if (activeTab === 'treinamentos') {
        const novaCategoria = await criarTreinamentoCategoria(formData);
        setCategoriasTreinamentos(prev => [...prev, { ...novaCategoria, total_treinamentos: 0 }]);
      }
      // Notícias não permitem criação
      
      setFormData({ nome: '', descricao: '', cor: '#3B82F6' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('❌ Erro ao criar categoria:', error);
      alert('Erro ao criar categoria');
    }
  };

  const handleUpdate = async (id, dadosAtualizados) => {
    try {
      if (activeTab === 'treinamentos') {
        await atualizarTreinamentoCategoria(id, dadosAtualizados);
        setCategoriasTreinamentos(prev => 
          prev.map(cat => cat.id === id ? { ...cat, ...dadosAtualizados } : cat)
        );
      } else {
        await atualizarNoticiasCategoria(id, dadosAtualizados);
        setCategoriasNoticias(prev => 
          prev.map(cat => cat.id === id ? { ...cat, ...dadosAtualizados } : cat)
        );
      }
      setEditingId(null);
    } catch (error) {
      console.error('❌ Erro ao atualizar categoria:', error);
      alert('Erro ao atualizar categoria');
    }
  };

  const handleToggleStatus = async (categoria) => {
    try {
      if (activeTab === 'treinamentos') {
        if (categoria.ativo) {
          await desativarTreinamentoCategoria(categoria.id);
        } else {
          await reativarTreinamentoCategoria(categoria.id);
        }
        setCategoriasTreinamentos(prev => 
          prev.map(cat => cat.id === categoria.id ? { ...cat, ativo: !cat.ativo } : cat)
        );
      } else {
        if (categoria.ativo) {
          await desativarNoticiasCategoria(categoria.id);
        } else {
          await reativarNoticiasCategoria(categoria.id);
        }
        setCategoriasNoticias(prev => 
          prev.map(cat => cat.id === categoria.id ? { ...cat, ativo: !cat.ativo } : cat)
        );
      }
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
      alert('Erro ao alterar status da categoria');
    }
  };

  const handleReorder = async (categoriaId, direction) => {
    const categorias = activeTab === 'treinamentos' ? categoriasTreinamentos : categoriasNoticias;
    const currentIndex = categorias.findIndex(cat => cat.id === categoriaId);
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === categorias.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newCategorias = [...categorias];
    
    // Trocar posições
    [newCategorias[currentIndex], newCategorias[newIndex]] = 
    [newCategorias[newIndex], newCategorias[currentIndex]];
    
    // Atualizar ordens
    const categoriasComNovaOrdem = newCategorias.map((cat, index) => ({
      id: cat.id,
      ordem: index + 1
    }));

    try {
      if (activeTab === 'treinamentos') {
        await reordenarTreinamentoCategorias(categoriasComNovaOrdem);
        setCategoriasTreinamentos(newCategorias.map((cat, index) => ({ ...cat, ordem: index + 1 })));
      } else {
        await reordenarNoticiasCategorias(categoriasComNovaOrdem);
        setCategoriasNoticias(newCategorias.map((cat, index) => ({ ...cat, ordem: index + 1 })));
      }
    } catch (error) {
      console.error('❌ Erro ao reordenar:', error);
      alert('Erro ao reordenar categorias');
    }
  };

  const CategoriaItem = ({ categoria, index }) => {
    const [editData, setEditData] = useState({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      cor: categoria.cor || '#3B82F6'
    });

    const isEditing = editingId === categoria.id;
    const totalItems = activeTab === 'treinamentos' 
      ? categoria.total_treinamentos || 0 
      : categoria.total_noticias || 0;

    return (
      <div className={`bg-white border rounded-lg p-4 ${categoria.ativo ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* Badge da categoria */}
            <span 
              className="px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: categoria.cor }}
            >
              {categoria.nome}
            </span>
            
            {/* Informações */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editData.nome}
                    onChange={(e) => setEditData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="Nome da categoria"
                  />
                  <input
                    type="text"
                    value={editData.descricao}
                    onChange={(e) => setEditData(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="Descrição (opcional)"
                  />
                  <div className="flex gap-1">
                    {cores.map(cor => (
                      <button
                        key={cor}
                        onClick={() => setEditData(prev => ({ ...prev, cor }))}
                        className={`w-6 h-6 rounded-full border-2 ${
                          editData.cor === cor ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{categoria.nome}</span>
                    <span className="text-sm text-gray-500">
                      ({totalItems} {activeTab === 'treinamentos' ? 'treinamentos' : 'notícias'})
                    </span>
                  </div>
                  {categoria.descricao && (
                    <p className="text-sm text-gray-600 mt-1">{categoria.descricao}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => handleUpdate(categoria.id, editData)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                  title="Salvar"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditingId(categoria.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Editar"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(categoria)}
                  className={`p-2 rounded ${
                    categoria.ativo 
                      ? 'text-orange-600 hover:bg-orange-50' 
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={categoria.ativo ? 'Desativar' : 'Ativar'}
                >
                  {categoria.ativo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <div className="flex flex-col">
                  <button
                    onClick={() => handleReorder(categoria.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleReorder(categoria.id, 'down')}
                    disabled={index === (activeTab === 'treinamentos' ? categoriasTreinamentos : categoriasNoticias).length - 1}
                    className="p-1 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-red-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
                <p className="text-red-100">Organize e configure as categorias do sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('treinamentos')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'treinamentos'
                  ? 'border-b-2 border-red-500 text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Tag className="w-5 h-5" />
                <span>Treinamentos ({categoriasTreinamentos.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('noticias')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'noticias'
                  ? 'border-b-2 border-red-500 text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Notícias ({categoriasNoticias.length})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando categorias...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Botão criar (apenas para treinamentos) */}
              {activeTab === 'treinamentos' && !showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-red-500 hover:text-red-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Criar nova categoria</span>
                </button>
              )}

              {/* Formulário de criação */}
              {showCreateForm && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Nova Categoria</h4>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Nome da categoria"
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descrição (opcional)"
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                    <div className="flex gap-1">
                      {cores.map(cor => (
                        <button
                          key={cor}
                          onClick={() => setFormData(prev => ({ ...prev, cor }))}
                          className={`w-6 h-6 rounded-full border-2 ${
                            formData.cor === cor ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: cor }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleCreate}
                      disabled={!formData.nome.trim()}
                      className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      Criar Categoria
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de categorias */}
              <div className="space-y-3">
                {(activeTab === 'treinamentos' ? categoriasTreinamentos : categoriasNoticias).map((categoria, index) => (
                  <CategoriaItem key={categoria.id} categoria={categoria} index={index} />
                ))}
              </div>

              {/* Mensagem se não houver categorias */}
              {(activeTab === 'treinamentos' ? categoriasTreinamentos : categoriasNoticias).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma categoria encontrada</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GerenciadorCategorias;

