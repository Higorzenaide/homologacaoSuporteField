import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { getCategoriasAtivas, criarCategoria } from '../services/categoriasTreinamentosService';

const CategoriaSelector = ({ 
  value, 
  onChange, 
  tipo = 'treinamentos', // 'treinamentos' ou 'noticias'
  allowCreate = true, // Permite criar novas categorias (apenas para treinamentos)
  required = false,
  className = ''
}) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    carregarCategorias();
  }, [tipo]);

  const carregarCategorias = async () => {
    setLoading(true);
    try {
      let categoriasData = [];
      
      if (tipo === 'treinamentos') {
        const { getCategoriasAtivas: getTreinamentoCategorias } = await import('../services/categoriasTreinamentosService');
        categoriasData = await getTreinamentoCategorias();
      } else if (tipo === 'noticias') {
        const { getCategoriasAtivas: getNoticiasCategorias } = await import('../services/categoriasNoticiasService');
        categoriasData = await getNoticiasCategorias();
      }
      
      setCategorias(categoriasData);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setCreating(true);
    try {
      const novaCategoriaData = {
        nome: newCategoryName.trim(),
        descricao: newCategoryDescription.trim(),
        cor: newCategoryColor,
        ativo: true
      };

      const novaCategoria = await criarCategoria(novaCategoriaData);
      
      // Atualizar lista de categorias
      setCategorias(prev => [...prev, novaCategoria]);
      
      // Selecionar a nova categoria automaticamente
      onChange(novaCategoria.nome);
      
      // Limpar formulário
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('#3B82F6');
      setShowCreateForm(false);
      
      console.log('✅ Nova categoria criada:', novaCategoria.nome);
    } catch (error) {
      console.error('❌ Erro ao criar categoria:', error);
      alert('Erro ao criar categoria. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryColor('#3B82F6');
    setShowCreateForm(false);
  };

  const cores = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  if (loading) {
    return (
      <div className={`w-full p-3 border border-gray-300 rounded-md bg-gray-50 ${className}`}>
        <span className="text-gray-500">Carregando categorias...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Seletor principal */}
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="">Selecione uma categoria</option>
          {categorias.map(categoria => (
            <option key={categoria.id} value={categoria.nome}>
              {categoria.nome}
            </option>
          ))}
        </select>

        {/* Botão para criar nova categoria (apenas para treinamentos) */}
        {allowCreate && tipo === 'treinamentos' && !showCreateForm && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Criar nova categoria
          </button>
        )}

        {/* Formulário de criação */}
        {showCreateForm && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Nova Categoria</h4>
              <button
                type="button"
                onClick={handleCancelCreate}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da categoria *
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Marketing Digital"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (opcional)
              </label>
              <input
                type="text"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Breve descrição da categoria"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor da categoria
              </label>
              <div className="flex gap-2 flex-wrap">
                {cores.map(cor => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setNewCategoryColor(cor)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newCategoryColor === cor ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: cor }}
                    title={cor}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span 
                  className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: newCategoryColor }}
                >
                  {newCategoryName || 'Preview'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || creating}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
              >
                {creating ? 'Criando...' : 'Criar Categoria'}
              </button>
              <button
                type="button"
                onClick={handleCancelCreate}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriaSelector;

