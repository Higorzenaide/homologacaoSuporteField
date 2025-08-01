import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, BookOpen, TrendingUp, Target, Download, Calendar, Star, ArrowRight, 
  Eye, Play, FileText, Award, Clock, Zap, Activity, BarChart3, 
  MessageCircle, Heart, Bookmark, ChevronRight, Sparkles, Newspaper, X
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

  // Função para extrair texto simples do HTML
  const extrairTextoSimples = (html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const abrirModalNoticia = (noticia) => {
    setNoticiaModal(noticia);
  };

  const fecharModalNoticia = () => {
    setNoticiaModal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-[var(--desktop-red)] absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section com cores padrão */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--desktop-red)] to-[var(--desktop-red-dark)]">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
            <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full -ml-40 -mb-40"></div>
            <div className="absolute bottom-20 left-20 w-48 h-48 bg-white rounded-full opacity-40"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-white">
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 rounded-3xl overflow-hidden bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-2xl flex items-center justify-center">
                <img
                  src="/logo.jpeg"
                  alt="Logo"
                  className="w-24 h-24 object-cover rounded-2xl"
                />
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-red-100 bg-clip-text text-transparent">
              Suporte Field
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-red-100 max-w-4xl mx-auto leading-relaxed">
              Equipe especializada em apoio ao técnico de campo, fornecendo suporte, 
              treinamentos e recursos necessários para garantir a excelência no 
              atendimento e instalação dos serviços Desktop Fibra Internet.
            </p>

            {/* Cards de acesso rápido condicionais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Treinamentos - sempre visível */}
              <Card 
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={() => setCurrentPage('treinamentos')}
              >
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-red-200" />
                  <h3 className="text-xl font-semibold mb-2">Treinamentos</h3>
                  <p className="text-red-100 text-sm">Acesse materiais e recursos</p>
                </CardContent>
              </Card>

              {/* Card condicional - Equipe (admin) ou Notícias (usuário) */}
              {isAdmin ? (
                <Card 
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => setCurrentPage('usuarios')}
                >
                  <CardContent className="p-6 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-red-200" />
                    <h3 className="text-xl font-semibold mb-2">Equipe</h3>
                    <p className="text-red-100 text-sm">Gerencie colaboradores</p>
                  </CardContent>
                </Card>
              ) : (
                <Card 
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => setCurrentPage('noticias')}
                >
                  <CardContent className="p-6 text-center">
                    <Newspaper className="w-12 h-12 mx-auto mb-4 text-red-200" />
                    <h3 className="text-xl font-semibold mb-2">Notícias</h3>
                    <p className="text-red-100 text-sm">Atualizações e avisos</p>
                  </CardContent>
                </Card>
              )}

              {/* Card condicional - Analytics (admin) ou Links Importantes (usuário) */}
              {isAdmin ? (
                <Card 
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => setCurrentPage('visualizar-feedbacks')}
                >
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-red-200" />
                    <h3 className="text-xl font-semibold mb-2">Analytics</h3>
                    <p className="text-red-100 text-sm">Visualize feedbacks</p>
                  </CardContent>
                </Card>
              ) : (
                <Card 
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => setCurrentPage('links-importantes')}
                >
                  <CardContent className="p-6 text-center">
                    <Bookmark className="w-12 h-12 mx-auto mb-4 text-red-200" />
                    <h3 className="text-xl font-semibold mb-2">Links Úteis</h3>
                    <p className="text-red-100 text-sm">Recursos importantes</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard de Estatísticas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-[var(--desktop-red)] mr-3" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-[var(--desktop-red)] bg-clip-text text-transparent">
              Dashboard de Performance
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Acompanhe métricas em tempo real e resultados que demonstram nosso compromisso com a excelência
          </p>
        </div>

        {/* Apenas as estatísticas reais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <EditableStatCard
            icon={BookOpen}
            value={stats.treinamentos}
            title="Treinamentos"
            subtitle="Materiais disponíveis"
            iconBgColor="bg-gradient-to-br from-red-100 to-red-200"
            iconColor="text-[var(--desktop-red)]"
            statKey="treinamentos"
            onSave={handleSaveStat}
          />

          <EditableStatCard
            icon={TrendingUp}
            value={stats.satisfacao}
            title="Satisfação"
            subtitle="Índice de qualidade"
            iconBgColor="bg-gradient-to-br from-red-100 to-red-200"
            iconColor="text-[var(--desktop-red)]"
            statKey="satisfacao"
            onSave={handleSaveStat}
          />

          <EditableStatCard
            icon={Target}
            value={stats.categorias}
            title="Categorias"
            subtitle="Áreas de conhecimento"
            iconBgColor="bg-gradient-to-br from-red-100 to-red-200"
            iconColor="text-[var(--desktop-red)]"
            statKey="categorias"
            onSave={handleSaveStat}
          />
        </div>
      </div>

      {/* Últimos Treinamentos com cores padrão */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-16">
            <div>
              <div className="flex items-center mb-4">
                <Play className="w-8 h-8 text-[var(--desktop-red)] mr-3" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-[var(--desktop-red)] bg-clip-text text-transparent">
                  Treinamentos Recentes
                </h2>
              </div>
              <p className="text-xl text-gray-600">
                Materiais mais recentes adicionados ao repositório de conhecimento
              </p>
            </div>
            <Button 
              onClick={() => setCurrentPage('treinamentos')}
              className="bg-gradient-to-r from-[var(--desktop-red)] to-[var(--desktop-red-dark)] hover:from-[var(--desktop-red-dark)] hover:to-[var(--desktop-red)] text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Ver Todos
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {ultimosTreinamentos.map((treinamento, index) => (
              <Card key={treinamento.id} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg overflow-hidden">
                {/* Header com gradiente vermelho */}
                <div className="h-32 bg-gradient-to-br from-[var(--desktop-red)] to-[var(--desktop-red-dark)] relative overflow-hidden">
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
                  <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg group-hover:text-[var(--desktop-red)] transition-colors">
                    {treinamento.titulo}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                    {treinamento.descricao}
                  </p>

                  {/* Apenas estatísticas reais se existirem */}
                  {(treinamento.visualizacoes || treinamento.downloads || treinamento.curtidas) && (
                    <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                      {treinamento.visualizacoes && (
                        <div className="flex items-center">
                          <Eye size={14} className="mr-1" />
                          <span>{treinamento.visualizacoes}</span>
                        </div>
                      )}
                      {treinamento.downloads && (
                        <div className="flex items-center">
                          <Download size={14} className="mr-1" />
                          <span>{treinamento.downloads}</span>
                        </div>
                      )}
                      {treinamento.curtidas && (
                        <div className="flex items-center">
                          <Heart size={14} className="mr-1" />
                          <span>{treinamento.curtidas}</span>
                        </div>
                      )}
                    </div>
                  )}

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
                    className="w-full bg-gradient-to-r from-[var(--desktop-red)] to-[var(--desktop-red-dark)] hover:from-[var(--desktop-red-dark)] hover:to-[var(--desktop-red)] text-white font-semibold py-2 rounded-lg transition-all duration-300 transform group-hover:scale-105"
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

      {/* Notícias em Destaque com modal */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-16">
            <div>
              <div className="flex items-center mb-4">
                <Star className="w-8 h-8 text-[var(--desktop-red)] mr-3" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-[var(--desktop-red)] bg-clip-text text-transparent">
                  Notícias em Destaque
                </h2>
              </div>
              <p className="text-xl text-gray-600">
                Informações importantes e atualizações para a equipe.
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => setCurrentPage('noticias')}
              className="border-2 border-[var(--desktop-red)] text-[var(--desktop-red)] hover:bg-[var(--desktop-red)] hover:text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Ver Todas
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {noticiasDestaque.map((noticia, index) => (
              <Card key={noticia.id} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border-0 shadow-lg overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-[var(--desktop-red)] to-[var(--desktop-red-dark)] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full -mr-8 -mt-8"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 bg-white rounded-full -ml-6 -mb-6"></div>
                  </div>
                  
                  <div className="relative z-10 p-4 flex items-center justify-between h-full">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {noticia.categoria}
                      </Badge>
                      <Badge className="bg-white text-[var(--desktop-red)] border-0 font-semibold">
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[var(--desktop-red)] transition-colors">
                    {noticia.titulo}
                  </h3>
                  
                  {/* Renderizar texto simples extraído do HTML */}
                  <p className="text-gray-700 mb-6 leading-relaxed line-clamp-4 text-base">
                    {extrairTextoSimples(noticia.conteudo)}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 flex items-center">
                      <Users size={14} className="mr-1" />
                      Publicado por <span className="font-semibold ml-1">{noticia.autor}</span>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => abrirModalNoticia(noticia)}
                      className="text-[var(--desktop-red)] hover:text-[var(--desktop-red-dark)] hover:bg-red-50 font-semibold"
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
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star size={48} className="text-[var(--desktop-red)]" />
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

      {/* Modal da Notícia */}
      {noticiaModal && (
        <Dialog open={!!noticiaModal} onOpenChange={fecharModalNoticia}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[var(--desktop-red)] to-[var(--desktop-red-dark)] rounded-xl flex items-center justify-center">
                    <Newspaper className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-gray-900 text-left">
                      {noticiaModal.titulo}
                    </DialogTitle>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className="bg-red-100 text-[var(--desktop-red)] border-red-200">
                        {noticiaModal.categoria}
                      </Badge>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar size={14} className="mr-1" />
                        {new Date(noticiaModal.dataPublicacao).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Users size={14} className="mr-1" />
                        {noticiaModal.autor}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fecharModalNoticia}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="mt-6">
              <div className="prose prose-lg max-w-none">
                {/* Renderizar HTML formatado no modal */}
                <div 
                  className="text-gray-700 leading-relaxed formatted-content"
                  dangerouslySetInnerHTML={{ __html: noticiaModal.conteudo }}
                />
              </div>
              
              {noticiaModal.tags && noticiaModal.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {noticiaModal.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rodapé */}
      <footer className="bg-gray-900 text-white py-12">
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
            <h3 className="text-2xl font-bold mb-4">Suporte Field</h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Comprometidos com a excelência no suporte técnico e treinamento contínuo da nossa equipe.
            </p>
            <div className="border-t border-gray-800 pt-6">
              <p className="text-gray-500">
                © 2025 Todos os direitos reservados - Suporte Field Desktop Fibra Internet
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Estilos para o conteúdo formatado */}
      <style jsx>{`
        .formatted-content strong, .formatted-content b {
          font-weight: 700 !important;
          color: #1f2937;
        }
        
        .formatted-content em, .formatted-content i {
          font-style: italic;
        }
        
        .formatted-content u {
          text-decoration: underline;
        }
        
        .formatted-content [style*="color: rgb(220, 38, 38)"] {
          color: #dc2626 !important;
        }
        
        .formatted-content [style*="color: rgb(5, 150, 105)"] {
          color: #059669 !important;
        }
        
        .formatted-content [style*="color: rgb(37, 99, 235)"] {
          color: #2563eb !important;
        }
        
        .formatted-content [style*="color: rgb(0, 0, 0)"] {
          color: #000000 !important;
        }
        
        .formatted-content font[size="1"] {
          font-size: 0.8em;
        }
        
        .formatted-content font[size="3"] {
          font-size: 1em;
        }
        
        .formatted-content font[size="5"] {
          font-size: 1.2em;
        }
        
        .formatted-content font[size="7"] {
          font-size: 1.4em;
        }
        
        .formatted-content ul, .formatted-content ol {
          margin: 1em 0;
          padding-left: 1.5em;
        }
        
        .formatted-content li {
          margin-bottom: 0.5em;
        }
        
        .formatted-content a {
          color: #dc2626;
          text-decoration: underline;
        }
        
        .formatted-content a:hover {
          color: #b91c1c;
        }
      `}</style>
    </div>
  );
};

export default Home;