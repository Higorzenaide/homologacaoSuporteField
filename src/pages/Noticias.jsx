import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNoticias, getCategoriasNoticias, createNoticia, editNoticia, deleteNoticia } from '../services/noticiasService';
import AdminModal from '../components/AdminModal';
import EditDeleteActions from '../components/EditDeleteActions';
import NoticiaCard from '../components/NoticiaCard';
import NoticiaModal from '../components/NoticiaModal';

const Noticias = () => {
  const { isAdmin } = useAuth();
  const [noticias, setNoticias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busca, setBusca] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNoticiaModal, setShowNoticiaModal] = useState(false);
  const [selectedNoticia, setSelectedNoticia] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [noticiasResult, categoriasResult] = await Promise.all([
        getNoticias(),
        getCategoriasNoticias()
      ]);

      if (noticiasResult.error) {
        setError(noticiasResult.error);
      } else {
        setNoticias(noticiasResult.data || []);
      }

      if (categoriasResult.error) {
        console.error('Erro ao carregar categorias:', categoriasResult.error);
      } else {
        setCategorias(categoriasResult.data || []);
      }
    } catch (error) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      let result;
      if (editingItem) {
        result = await editNoticia(editingItem.id, formData);
      } else {
        result = await createNoticia(formData);
      }

      if (result.error) {
        setError(result.error);
        return false;
      } else {
        setSuccess(editingItem ? 'Notícia atualizada com sucesso!' : 'Notícia criada com sucesso!');
        carregarDados();
        return true;
      }
    } catch (error) {
      setError('Erro interno do servidor');
      return false;
    }
  };

  const handleEdit = (noticia) => {
    setEditingItem(noticia);
    setShowModal(true);
  };

  const handleDelete = async (noticia) => {
    try {
      const result = await deleteNoticia(noticia.id);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Notícia excluída com sucesso!');
        carregarDados();
      }
    } catch (error) {
      setError('Erro ao excluir notícia');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setError('');
    setSuccess('');
  };

  const handleOpenComments = (noticia) => {
    setSelectedNoticia(noticia);
    setShowNoticiaModal(true);
  };

  const noticiasFiltradas = noticias.filter(noticia => {
    const matchCategoria = !filtroCategoria || noticia.categoria_nome === filtroCategoria;
    const matchBusca = !busca || 
      noticia.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      noticia.conteudo?.toLowerCase().includes(busca.toLowerCase());
    
    return matchCategoria && matchBusca;
  });

  // Separar notícias em destaque e normais
  const noticiasDestaque = noticiasFiltradas.filter(noticia => noticia.destaque);
  const noticiasNormais = noticiasFiltradas.filter(noticia => !noticia.destaque);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Carregando notícias...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notícias</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Nova Notícia
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por título ou conteúdo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="md:w-64">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(categoria => (
              <option key={categoria.id} value={categoria.nome}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notícias em destaque */}
      {noticiasDestaque.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Notícias em Destaque</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {noticiasDestaque.map((noticia) => (
              <NoticiaCard
                key={noticia.id}
                noticia={noticia}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpenComments={handleOpenComments}
                isDestaque={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Notícias normais */}
      {noticiasNormais.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {noticiasDestaque.length > 0 ? 'Outras Notícias' : 'Notícias'}
          </h2>
          <div className="space-y-6">
            {noticiasNormais.map((noticia) => (
              <NoticiaCard
                key={noticia.id}
                noticia={noticia}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpenComments={handleOpenComments}
                isDestaque={false}
              />
            ))}
          </div>
        </div>
      )}

      {noticiasFiltradas.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {busca || filtroCategoria ? 'Nenhuma notícia encontrada com os filtros aplicados' : 'Nenhuma notícia disponível'}
          </div>
        </div>
      )}

      {/* Modal de administração */}
      <AdminModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        type="noticia"
        editingItem={editingItem}
        categorias={categorias}
      />

      {/* Modal de notícia com comentários */}
      <NoticiaModal
        isOpen={showNoticiaModal}
        onClose={() => setShowNoticiaModal(false)}
        noticia={selectedNoticia}
      />
    </div>
  );
};

export default Noticias;

