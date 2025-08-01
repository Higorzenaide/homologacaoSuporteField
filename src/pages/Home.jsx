import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, TrendingUp, Target, Download, Calendar, Star, ArrowRight } from 'lucide-react';
import { getTreinamentos } from '../services/treinamentosService';
import { obterEstatisticas } from '../services/estatisticasService';
import { atualizarEstatistica } from '../services/estatisticasService';
import { getNoticiasDestaque } from '../services/noticiasService';
import EditableStatCard from '../components/EditableStatCard';
import { useAuth } from '../contexts/AuthContext';

const Home = ({ setCurrentPage }) => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    treinamentos: 0,
    satisfacao: '98%',
    categorias: 5
  });
  const [ultimosTreinamentos, setUltimosTreinamentos] = useState([]);
  const [noticiasDestaque, setNoticiasDestaque] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noticiaModal, setNoticiaModal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsResult, treinamentosResult, noticiasResult] = await Promise.all([
        obterEstatisticas(),
        getTreinamentos(),
        getNoticiasDestaque(2)
      ]);

      console.log('📊 Resultado das estatísticas:', statsResult);

      if (statsResult.success && statsResult.data) {
        console.log('✅ Carregando estatísticas do banco:', statsResult.data);
        setStats(statsResult.data);
      } else {
        console.log('⚠️ Usando valores padrão para estatísticas');
        // Manter valores padrão se não conseguir carregar do banco
      }

      if (treinamentosResult.data) {
        // Pegar os 3 treinamentos mais recentes
        const recentes = treinamentosResult.data
          .sort((a, b) => new Date(b.dataUpload) - new Date(a.dataUpload))
          .slice(0, 3);
        setUltimosTreinamentos(recentes);
      }

      if (noticiasResult.data) {
        setNoticiasDestaque(noticiasResult.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (treinamento) => {
    if (treinamento.arquivo) {
      window.open(treinamento.arquivo, '_blank');
    }
  };

  const handleSaveStat = async (statKey, newValue) => {
    try {
      console.log(`🔄 Salvando ${statKey}:`, newValue);
      
      const result = await atualizarEstatistica(statKey, newValue);
      
      if (result.success) {
        console.log('✅ Sucesso - Atualizando estado local');
        setStats(prev => ({
          ...prev,
          [statKey]: newValue
        }));
        return true;
      } else {
        console.error('❌ Erro ao salvar:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na função handleSaveStat:', error);
      return false;
    }
  };

  // Função para extrair texto simples do HTML
  const extrairTextoSimples = (html) => {
    if (!html) return '';
    // Criar elemento temporário para extrair texto
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Função para truncar texto
  const truncarTexto = (texto, limite = 200) => {
    if (!texto) return '';
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite).trim() + '...';
  };

  // Funções do modal de notícias
  const abrirModalNoticia = (noticia) => {
    setNoticiaModal(noticia);
  };

  const fecharModalNoticia = () => {
    setNoticiaModal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--desktop-red)]"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  console.log(user);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[var(--desktop-red)] to-[var(--desktop-red-dark)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white flex items-center justify-center">
                <img
                  src="/logo.jpeg"
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Suporte Field
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-red-100 max-w-3xl mx-auto">
              Equipe especializada em apoio ao técnico de campo, fornecendo suporte, 
              treinamentos e recursos necessários para garantir a excelência no 
              atendimento e instalação dos serviços Desktop Fibra Internet.
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossos Resultados</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Números que demonstram nosso compromisso com a excelência no suporte técnico
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <EditableStatCard
            icon={BookOpen}
            value={stats.treinamentos}
            title="Treinamentos"
            subtitle="Materiais disponíveis"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            statKey="treinamentos"
            onSave={handleSaveStat}
          />

          <EditableStatCard
            icon={TrendingUp}
            value={stats.satisfacao}
            title="Satisfação"
            subtitle="Índice de qualidade"
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
            statKey="satisfacao"
            onSave={handleSaveStat}
          />

          <EditableStatCard
            icon={Target}
            value={stats.categorias}
            title="Categorias"
            subtitle="Áreas de conhecimento"
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            statKey="categorias"
            onSave={handleSaveStat}
          />
        </div>
      </div>

      {/* Últimos Treinamentos */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Últimos Treinamentos</h2>
              <p className="text-gray-600">
                Materiais mais recentes adicionados ao repositório
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => setCurrentPage('treinamentos')}
              className="text-[var(--desktop-red)] border-[var(--desktop-red)] hover:bg-[var(--desktop-red)] hover:text-white"
            >
              Ver Todos
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ultimosTreinamentos.map((treinamento) => (
              <div key={treinamento.id} className="bg-gray-50 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge 
                      variant="secondary" 
                      className="bg-[var(--desktop-red)] text-white"
                    >
                      {treinamento.categoria}
                    </Badge>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {new Date(treinamento.dataUpload).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {treinamento.titulo}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {treinamento.descricao}
                  </p>

                  {treinamento.tags && treinamento.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {treinamento.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {treinamento.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{treinamento.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => handleDownload(treinamento)}
                    className="w-full bg-[var(--desktop-red)] hover:bg-[var(--desktop-red-dark)] text-white"
                    size="sm"
                  >
                    <Download size={16} className="mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {ultimosTreinamentos.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum treinamento disponível
              </h3>
              <p className="text-gray-600">
                Os treinamentos aparecerão aqui quando forem adicionados
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notícias em Destaque */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notícias em Destaque</h2>
              <p className="text-gray-600">
                Informações importantes para a equipe de campo
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => setCurrentPage('noticias')}
              className="text-[var(--desktop-red)] border-[var(--desktop-red)] hover:bg-[var(--desktop-red)] hover:text-white"
            >
              Ver Todas
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {noticiasDestaque.map((noticia) => (
              <div key={noticia.id} className="bg-white rounded-lg shadow-sm border border-yellow-400 border-2 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="secondary" 
                        className="bg-[var(--desktop-red)] text-white"
                      >
                        {noticia.categoria}
                      </Badge>
                      <Badge variant="outline" className="border-yellow-400 text-yellow-600">
                        <Star size={12} className="mr-1" />
                        Destaque
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {new Date(noticia.dataPublicacao).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {noticia.titulo}
                  </h3>
                  
                  {/* Renderizar texto simples extraído do HTML */}
                  <p className="text-gray-700 mb-4 leading-relaxed line-clamp-4">
                    {truncarTexto(extrairTextoSimples(noticia.conteudo))}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Publicado por {noticia.autor}
                    </div>
                    <Button
                      onClick={() => abrirModalNoticia(noticia)}
                      variant="outline"
                      size="sm"
                      className="text-[var(--desktop-red)] border-[var(--desktop-red)] hover:bg-[var(--desktop-red)] hover:text-white"
                    >
                      Ler mais
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {noticiasDestaque.length === 0 && (
            <div className="text-center py-12">
              <Star size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma notícia em destaque
              </h3>
              <p className="text-gray-600">
                As notícias em destaque aparecerão aqui quando forem publicadas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Notícia */}
      {noticiaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-3">
                    {noticiaModal.destaque && (
                      <span className="bg-yellow-400 text-red-800 text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                        <Star size={12} />
                        DESTAQUE
                      </span>
                    )}
                    <span className="bg-white bg-opacity-20 backdrop-blur-sm text-white text-sm px-4 py-1.5 rounded-full border border-white border-opacity-30">
                      {noticiaModal.categoria}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mb-3">{noticiaModal.titulo}</h2>
                  <div className="flex items-center text-white text-opacity-90 text-sm">
                    <span className="mr-4">Por: {noticiaModal.autor}</span>
                    <span>{new Date(noticiaModal.dataPublicacao).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>
                <button
                  onClick={fecharModalNoticia}
                  className="text-white hover:text-red-200 transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div 
                className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: noticiaModal.conteudo }}
                style={{
                  fontSize: '16px',
                  lineHeight: '1.7'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Rodapé Simplificado */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">
            © 2025 Todos os direitos reservados Suporte Field
          </p>
        </div>
      </footer>

      {/* Estilos para o conteúdo formatado no modal */}
      <style jsx>{`
        .prose strong, .prose b {
          font-weight: 700 !important;
          color: #1f2937;
        }
        
        .prose em, .prose i {
          font-style: italic;
        }
        
        .prose u {
          text-decoration: underline;
        }
        
        .prose [style*="color: rgb(220, 38, 38)"] {
          color: #dc2626 !important;
        }
        
        .prose [style*="color: rgb(5, 150, 105)"] {
          color: #059669 !important;
        }
        
        .prose [style*="color: rgb(37, 99, 235)"] {
          color: #2563eb !important;
        }
        
        .prose [style*="color: rgb(0, 0, 0)"] {
          color: #000000 !important;
        }
        
        .prose font[size="1"] {
          font-size: 0.8em;
        }
        
        .prose font[size="3"] {
          font-size: 1em;
        }
        
        .prose font[size="5"] {
          font-size: 1.2em;
        }
        
        .prose font[size="7"] {
          font-size: 1.4em;
        }
        
        .prose ul, .prose ol {
          margin: 1em 0;
          padding-left: 1.5em;
        }
        
        .prose li {
          margin-bottom: 0.5em;
        }
        
        .prose a {
          color: #dc2626;
          text-decoration: underline;
        }
        
        .prose a:hover {
          color: #b91c1c;
        }
      `}</style>
    </div>
  );
};

export default Home;
