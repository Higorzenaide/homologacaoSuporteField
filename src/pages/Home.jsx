import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, BookOpen, TrendingUp, Target, Download, Calendar, Star, ArrowRight, 
  Eye, Play, FileText, Award, Clock, Zap, Activity, BarChart3, 
  MessageCircle, Heart, Bookmark, ChevronRight, Sparkles, Newspaper, X, User
} from 'lucide-react';
import { getTreinamentos } from '../services/treinamentosService';
import { obterEstatisticas } from '../services/estatisticasService';
import { atualizarEstatistica } from '../services/estatisticasService';
import { getNoticiasDestaque } from '../services/noticiasService';
import EditableStatCard from '../components/EditableStatCard';
import { useAuth } from '../contexts/AuthContext';

// Componente das bolinhas interativas - VERSÃO COM LEGIBILIDADE MELHORADA
const InteractiveBackground = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef([]);
  const animationRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    
    // Configurar canvas
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Recriar partículas quando redimensionar
      if (canvas.width > 0 && canvas.height > 0) {
        particlesRef.current = createParticles();
      }
    };
    
    // Criar partículas (bolinhas) - OTIMIZADO PARA LEGIBILIDADE
    const createParticles = () => {
      const particles = [];
      // Reduzir quantidade de partículas
      const particleCount = Math.max(5, Math.floor((canvas.width * canvas.height) / 30000));
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.2, // Velocidade ligeiramente reduzida
          vy: (Math.random() - 0.5) * 1.2,
          radius: Math.random() * 20 + 10, // Tamanho menor (10-30px)
          opacity: Math.random() * 0.2 + 0.1, // Opacidade muito reduzida (0.1-0.3)
        });
      }
      
      return particles;
    };

    // Configuração inicial
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Rastrear mouse no container
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    // Adicionar listener ao container (não ao canvas)
    container.addEventListener('mousemove', handleMouseMove);

    // Animação
    const animate = () => {
      if (!canvas.width || !canvas.height) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        // Movimento natural
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Bounce nas bordas
        if (particle.x <= particle.radius || particle.x >= canvas.width - particle.radius) {
          particle.vx *= -1;
        }
        if (particle.y <= particle.radius || particle.y >= canvas.height - particle.radius) {
          particle.vy *= -1;
        }
        
        // Manter dentro dos limites
        particle.x = Math.max(particle.radius, Math.min(canvas.width - particle.radius, particle.x));
        particle.y = Math.max(particle.radius, Math.min(canvas.height - particle.radius, particle.y));
        
        // Efeito de repulsão do mouse
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const repulsionRadius = 100; // Raio menor
        
        if (distance < repulsionRadius && distance > 0) {
          const force = (repulsionRadius - distance) / repulsionRadius;
          const angle = Math.atan2(dy, dx);
          
          // Aplicar força de repulsão
          particle.x -= Math.cos(angle) * force * 6;
          particle.y -= Math.sin(angle) * force * 6;
        }
        
        // Desenhar partícula BRANCA com gradiente MAIS SUTIL
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.radius
        );
        
        // Gradiente branco com transparência MUITO REDUZIDA
        gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${particle.opacity * 0.4})`);
        gradient.addColorStop(0.8, `rgba(255, 255, 255, ${particle.opacity * 0.1})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Iniciar animação
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      container.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          opacity: 0.5, // Opacidade geral reduzida
          zIndex: 1
        }}
      />
    </div>
  );
};

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
      {/* Hero Section com fundo interativo */}
      <div className="relative overflow-hidden min-h-[600px]">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--desktop-red)] to-[var(--desktop-red-dark)]">
          {/* Fundo interativo com bolinhas SUTIS */}
          <InteractiveBackground />
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

            {/* Título com sombra para melhor legibilidade */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-red-100 bg-clip-text text-transparent drop-shadow-lg">
              Suporte Field
            </h1>
            
            {/* Parágrafo com sombra e backdrop-filter para melhor legibilidade */}
            <div className="relative">
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-2xl"></div>
              <p className="relative text-xl md:text-2xl mb-12 text-white max-w-4xl mx-auto leading-relaxed p-6 drop-shadow-md">
                Equipe especializada em apoio ao técnico de campo, fornecendo suporte, 
                treinamentos e recursos necessários para garantir a excelência no 
                atendimento e instalação dos serviços Desktop Fibra Internet.
              </p>
            </div>

            {/* Cards de acesso rápido condicionais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Treinamentos - sempre visível */}
              <Card 
                className="bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-xl"
                onClick={() => setCurrentPage('treinamentos')}
              >
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-red-200 drop-shadow-md" />
                  <h3 className="text-xl font-semibold mb-2 drop-shadow-md">Treinamentos</h3>
                  <p className="text-red-100 text-sm drop-shadow-sm">Acesse materiais e recursos</p>
                </CardContent>
              </Card>

              {/* Card condicional - Equipe (admin) ou Notícias (usuário) */}
              {isAdmin ? (
                <Card 
                  className="bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-xl"
                  onClick={() => setCurrentPage('usuarios')}
                >
                  <CardContent className="p-6 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-red-200 drop-shadow-md" />
                    <h3 className="text-xl font-semibold mb-2 drop-shadow-md">Equipe</h3>
                    <p className="text-red-100 text-sm drop-shadow-sm">Gerencie colaboradores</p>
                  </CardContent>
                </Card>
              ) : (
                <Card 
                  className="bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-xl"
                  onClick={() => setCurrentPage('noticias')}
                >
                  <CardContent className="p-6 text-center">
                    <Newspaper className="w-12 h-12 mx-auto mb-4 text-red-200 drop-shadow-md" />
                    <h3 className="text-xl font-semibold mb-2 drop-shadow-md">Notícias</h3>
                    <p className="text-red-100 text-sm drop-shadow-sm">Atualizações e avisos</p>
                  </CardContent>
                </Card>
              )}

              {/* Card condicional - Analytics (admin) ou Links Importantes (usuário) */}
              {isAdmin ? (
                <Card 
                  className="bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-xl"
                  onClick={() => setCurrentPage('visualizar-feedbacks')}
                >
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-red-200 drop-shadow-md" />
                    <h3 className="text-xl font-semibold mb-2 drop-shadow-md">Análises</h3>
                    <p className="text-red-100 text-sm drop-shadow-sm">Visualize feedbacks</p>
                  </CardContent>
                </Card>
              ) : (
                <Card 
                  className="bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-xl"
                  onClick={() => setCurrentPage('links-importantes')}
                >
                  <CardContent className="p-6 text-center">
                    <Bookmark className="w-12 h-12 mx-auto mb-4 text-red-200 drop-shadow-md" />
                    <h3 className="text-xl font-semibold mb-2 drop-shadow-md">Links Úteis</h3>
                    <p className="text-red-100 text-sm drop-shadow-sm">Recursos importantes</p>
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

      {/* Últimos Treinamentos */}
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
              className="bg-gradient-to-r from-[var(--desktop-red)] to-[var(--desktop-red-dark)] hover:from-[var(--desktop-red-dark)] hover:to-[var(--desktop-red)] text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Ver Todos
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {ultimosTreinamentos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {ultimosTreinamentos.map((treinamento) => (
                <Card key={treinamento.id} className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-6 h-6 text-[var(--desktop-red)]" />
                      </div>
                      <Badge variant="secondary" className="bg-red-50 text-[var(--desktop-red)] border-red-200">
                        {treinamento.categoria}
                      </Badge>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-3 text-gray-900 group-hover:text-[var(--desktop-red)] transition-colors duration-300 line-clamp-2">
                      {treinamento.titulo}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {treinamento.descricao}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(treinamento.dataUpload).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {treinamento.visualizacoes || 0}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleDownload(treinamento)}
                      className="w-full bg-gradient-to-r from-[var(--desktop-red)] to-[var(--desktop-red-dark)] hover:from-[var(--desktop-red-dark)] hover:to-[var(--desktop-red)] text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Material
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-[var(--desktop-red)]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Nenhum treinamento encontrado</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Ainda não há treinamentos disponíveis. Novos materiais serão adicionados em breve.
              </p>
              <Button 
                onClick={() => setCurrentPage('treinamentos')}
                className="bg-gradient-to-r from-[var(--desktop-red)] to-[var(--desktop-red-dark)] hover:from-[var(--desktop-red-dark)] hover:to-[var(--desktop-red)] text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Explorar Treinamentos
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Notícias em Destaque - COM AUTOR */}
      {noticiasDestaque.length > 0 && (
        <div className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-16">
              <div>
                <div className="flex items-center mb-4">
                  <Newspaper className="w-8 h-8 text-[var(--desktop-red)] mr-3" />
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-[var(--desktop-red)] bg-clip-text text-transparent">
                    Notícias em Destaque
                  </h2>
                </div>
                <p className="text-xl text-gray-600">
                  Fique por dentro das últimas atualizações e comunicados importantes
                </p>
              </div>
              <Button 
                onClick={() => setCurrentPage('noticias')}
                className="bg-gradient-to-r from-[var(--desktop-red)] to-[var(--desktop-red-dark)] hover:from-[var(--desktop-red-dark)] hover:to-[var(--desktop-red)] text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Ver Todas
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {noticiasDestaque.map((noticia) => (
                <Card 
                  key={noticia.id} 
                  className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 cursor-pointer"
                  onClick={() => abrirModalNoticia(noticia)}
                >
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <Badge variant="secondary" className="bg-red-50 text-[var(--desktop-red)] border-red-200 px-3 py-1">
                        {noticia.categoria}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(noticia.dataPublicacao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-2xl mb-4 text-gray-900 group-hover:text-[var(--desktop-red)] transition-colors duration-300 line-clamp-2">
                      {noticia.titulo}
                    </h3>
                    
                    {/* AUTOR ADICIONADO */}
                    {noticia.autor && (
                      <div className="flex items-center mb-4 text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium">Por {noticia.autor}</span>
                      </div>
                    )}
                    
                    <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                      {extrairTextoSimples(noticia.conteudo)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {noticia.visualizacoes || 0}
                        </div>
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {noticia.curtidas || 0}
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {noticia.comentarios || 0}
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-[var(--desktop-red)] group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Notícia - COM AUTOR */}
      {noticiaModal && (
        <Dialog open={!!noticiaModal} onOpenChange={fecharModalNoticia}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="bg-red-50 text-[var(--desktop-red)] border-red-200">
                  {noticiaModal.categoria}
                </Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(noticiaModal.dataPublicacao).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-4">
                {noticiaModal.titulo}
              </DialogTitle>
              
              {/* AUTOR NO MODAL */}
              {noticiaModal.autor && (
                <div className="flex items-center mb-6 text-gray-600">
                  <User className="w-5 h-5 mr-2" />
                  <span className="font-medium text-lg">Por {noticiaModal.autor}</span>
                </div>
              )}
            </DialogHeader>
            
            <div className="prose max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: noticiaModal.conteudo }}
                className="text-gray-700 leading-relaxed"
              />
            </div>
            
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {noticiaModal.visualizacoes || 0} visualizações
                </div>
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {noticiaModal.curtidas || 0} curtidas
                </div>
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {noticiaModal.comentarios || 0} comentários
                </div>
              </div>
              
              <Button 
                onClick={fecharModalNoticia}
                variant="outline"
                className="border-[var(--desktop-red)] text-[var(--desktop-red)] hover:bg-[var(--desktop-red)] hover:text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rodapé */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo e descrição */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center mr-4">
                  <img
                    src="/logo.jpeg"
                    alt="Logo"
                    className="w-8 h-8 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-2xl font-bold">Suporte Field</h3>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Equipe especializada em apoio ao técnico de campo, fornecendo suporte, 
                treinamentos e recursos necessários para garantir a excelência no 
                atendimento e instalação dos serviços Desktop Fibra Internet.
              </p>
            </div>

            {/* Links rápidos */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Links Rápidos</h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => setCurrentPage('treinamentos')}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Treinamentos
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentPage('noticias')}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Notícias
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentPage('links-importantes')}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Links Importantes
                  </button>
                </li>
              </ul>
            </div>

            {/* Informações de contato */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Contato</h4>
              <div className="space-y-3 text-gray-300">
                <p>Desktop Fibra Internet</p>
                <p>Suporte Técnico de Campo</p>
                <p className="text-sm">
                  © 2024 Desktop Fibra Internet. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;