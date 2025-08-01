import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, BookOpen, TrendingUp, Target, Download, Calendar, Star, ArrowRight, 
  Eye, Play, FileText, Award, Clock, Zap, Activity, BarChart3, 
  MessageCircle, Heart, Bookmark, ChevronRight, Sparkles
} from 'lucide-react';
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

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      if (treinamentosResult.data) {
        const recentes = treinamentosResult.data
          .sort((a, b) => new Date(b.dataUpload) - new Date(a.dataUpload))
          .slice(0, 4);
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
      const result = await atualizarEstatistica(statKey, newValue);
      
      if (result.success) {
        setStats(prev => ({
          ...prev,
          [statKey]: newValue
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao salvar estatística:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-600 absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero Section Modernizado */}
      <div className="relative overflow-hidden">
        {/* Background com padrões geométricos */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
            <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full -ml-40 -mb-40"></div>
            <div className="absolute bottom-20 left-20 w-48 h-48 bg-white rounded-full opacity-40"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-white">
            {/* Logo com efeito glassmorphism */}
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 rounded-3xl overflow-hidden bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-2xl flex items-center justify-center">
                <img
                  src="/logo.jpeg"
                  alt="Logo"
                  className="w-24 h-24 object-cover rounded-2xl"
                />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Suporte Field
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Equipe especializada em apoio ao técnico de campo, fornecendo suporte, 
              treinamentos e recursos necessários para garantir a excelência no 
              atendimento e instalação dos serviços Desktop Fibra Internet.
            </p>

            {/* Cards de acesso rápido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card 
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={() => setCurrentPage('treinamentos')}
              >
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-200" />
                  <h3 className="text-xl font-semibold mb-2">Treinamentos</h3>
                  <p className="text-blue-100 text-sm">Acesse materiais e recursos</p>
                </CardContent>
              </Card>

              <Card 
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={() => setCurrentPage('usuarios')}
              >
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-purple-200" />
                  <h3 className="text-xl font-semibold mb-2">Equipe</h3>
                  <p className="text-blue-100 text-sm">Gerencie colaboradores</p>
                </CardContent>
              </Card>

              <Card 
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={() => setCurrentPage('visualizar-feedbacks')}
              >
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-green-200" />
                  <h3 className="text-xl font-semibold mb-2">Analytics</h3>
                  <p className="text-blue-100 text-sm">Visualize feedbacks</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard de Estatísticas Melhorado */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600 mr-3" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-indigo-600 bg-clip-text text-transparent">
              Dashboard de Performance
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Acompanhe métricas em tempo real e resultados que demonstram nosso compromisso com a excelência
          </p>
        </div>

        {/* Estatísticas principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <EditableStatCard
            icon={BookOpen}
            value={stats.treinamentos}
            title="Treinamentos"
            subtitle="Materiais disponíveis"
            iconBgColor="bg-gradient-to-br from-blue-100 to-blue-200"
            iconColor="text-blue-600"
            statKey="treinamentos"
            onSave={handleSaveStat}
          />

          <EditableStatCard
            icon={TrendingUp}
            value={stats.satisfacao}
            title="Satisfação"
            subtitle="Índice de qualidade"
            iconBgColor="bg-gradient-to-br from-green-100 to-green-200"
            iconColor="text-green-600"
            statKey="satisfacao"
            onSave={handleSaveStat}
          />

          <EditableStatCard
            icon={Target}
            value={stats.categorias}
            title="Categorias"
            subtitle="Áreas de conhecimento"
            iconBgColor="bg-gradient-to-br from-purple-100 to-purple-200"
            iconColor="text-purple-600"
            statKey="categorias"
            onSave={handleSaveStat}
          />
        </div>

        {/* Cards de métricas adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Visualizações</p>
                  <p className="text-2xl font-bold text-orange-700">1.2k+</p>
                </div>
                <Eye className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-600 text-sm font-medium">Downloads</p>
                  <p className="text-2xl font-bold text-cyan-700">856</p>
                </div>
                <Download className="w-8 h-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-600 text-sm font-medium">Feedbacks</p>
                  <p className="text-2xl font-bold text-pink-700">342</p>
                </div>
                <MessageCircle className="w-8 h-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 text-sm font-medium">Uptime</p>
                  <p className="text-2xl font-bold text-emerald-700">99.9%</p>
                </div>
                <Activity className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Últimos Treinamentos Redesenhado */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-16">
            <div>
              <div className="flex items-center mb-4">
                <Play className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                  Treinamentos Recentes
                </h2>
              </div>
              <p className="text-xl text-gray-600">
                Materiais mais recentes adicionados ao repositório de conhecimento
              </p>
            </div>
            <Button 
              onClick={() => setCurrentPage('treinamentos')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Ver Todos
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {ultimosTreinamentos.map((treinamento, index) => (
              <Card key={treinamento.id} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg overflow-hidden">
                {/* Header com gradiente baseado no índice */}
                <div className={`h-32 bg-gradient-to-br ${
                  index % 4 === 0 ? 'from-blue-500 to-blue-600' :
                  index % 4 === 1 ? 'from-purple-500 to-purple-600' :
                  index % 4 === 2 ? 'from-green-500 to-green-600' :
                  'from-orange-500 to-orange-600'
                } relative overflow-hidden`}>
                  {/* Padrões geométricos */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full -ml-8 -mb-8"></div>
                  </div>
                  
                  <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {treinamento.categoria}
                      </Badge>
                      <div className="text-white/90 text-xs flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {new Date(treinamento.dataUpload).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    <div className="text-white">
                      <FileText className="w-8 h-8 mb-2" />
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg group-hover:text-blue-600 transition-colors">
                    {treinamento.titulo}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                    {treinamento.descricao}
                  </p>

                  {/* Estatísticas do treinamento */}
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Eye size={14} className="mr-1" />
                      <span>{treinamento.visualizacoes || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <Download size={14} className="mr-1" />
                      <span>{treinamento.downloads || 0}</span>
                    </div>
                    <div className="flex items-center">
                      <Heart size={14} className="mr-1" />
                      <span>{treinamento.curtidas || 0}</span>
                    </div>
                  </div>

                  {treinamento.tags && treinamento.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {treinamento.tags.slice(0, 2).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs px-2 py-1">
                          #{tag}
                        </Badge>
                      ))}
                      {treinamento.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          +{treinamento.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => handleDownload(treinamento)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg transition-all duration-300 transform group-hover:scale-105"
                    size="sm"
                  >
                    <Download size={16} className="mr-2" />
                    Acessar Treinamento
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {ultimosTreinamentos.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen size={48} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Nenhum treinamento disponível
              </h3>
              <p className="text-gray-600 text-lg">
                Os treinamentos aparecerão aqui quando forem adicionados ao sistema
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notícias em Destaque Redesenhado */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-16">
            <div>
              <div className="flex items-center mb-4">
                <Star className="w-8 h-8 text-yellow-500 mr-3" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-yellow-600 bg-clip-text text-transparent">
                  Notícias em Destaque
                </h2>
              </div>
              <p className="text-xl text-gray-600">
                Informações importantes e atualizações para a equipe de campo
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => setCurrentPage('noticias')}
              className="border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-400 hover:text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Ver Todas
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {noticiasDestaque.map((noticia, index) => (
              <Card key={noticia.id} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border-0 shadow-lg overflow-hidden">
                {/* Header com gradiente */}
                <div className={`h-20 bg-gradient-to-r ${
                  index % 2 === 0 ? 'from-yellow-400 to-orange-500' : 'from-orange-400 to-red-500'
                } relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full -mr-8 -mt-8"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 bg-white rounded-full -ml-6 -mb-6"></div>
                  </div>
                  
                  <div className="relative z-10 p-4 flex items-center justify-between h-full">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {noticia.categoria}
                      </Badge>
                      <Badge className="bg-white text-yellow-600 border-0 font-semibold">
                        <Star size={12} className="mr-1" />
                        Destaque
                      </Badge>
                    </div>
                    <div className="text-white/90 text-sm flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {new Date(noticia.dataPublicacao).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-yellow-600 transition-colors">
                    {noticia.titulo}
                  </h3>
                  
                  <p className="text-gray-700 mb-6 leading-relaxed line-clamp-4 text-base">
                    {noticia.conteudo}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 flex items-center">
                      <Users size={14} className="mr-1" />
                      Publicado por <span className="font-semibold ml-1">{noticia.autor}</span>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 font-semibold"
                    >
                      Ler mais
                      <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {noticiasDestaque.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star size={48} className="text-yellow-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Nenhuma notícia em destaque
              </h3>
              <p className="text-gray-600 text-lg">
                As notícias em destaque aparecerão aqui quando forem publicadas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé Modernizado */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <img
                  src="/logo.jpeg"
                  alt="Logo"
                  className="w-12 h-12 object-cover rounded-xl"
                />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-2">Suporte Field</h3>
            <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
              Excelência em suporte técnico e treinamento para equipes de campo
            </p>
            
            <div className="border-t border-white/20 pt-6">
              <p className="text-blue-300">
                © 2025 Todos os direitos reservados • Suporte Field
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;