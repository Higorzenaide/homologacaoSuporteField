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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[var(--desktop-red)] to-[var(--desktop-red-dark)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <Users size={48} className="text-white" />
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
                  
                  <p className="text-gray-700 mb-4 leading-relaxed line-clamp-4">
                    {noticia.conteudo}
                  </p>

                  <div className="text-sm text-gray-500">
                    Publicado por {noticia.autor}
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

      {/* Rodapé Simplificado */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">
            © 2025 Todos os direitos reservados Suporte Field
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

