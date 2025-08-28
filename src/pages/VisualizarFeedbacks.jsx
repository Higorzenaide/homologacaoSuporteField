import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usuariosService } from '../services/usuariosService';
import { categoriasFeedbackService } from '../services/categoriasFeedbackService';
import { feedbackService } from '../services/feedbackService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Loader2, 
  Eye, 
  Filter, 
  Download, 
  BarChart3, 
  PieChart, 
  Users, 
  MessageSquare,
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  LineChart,
  Pie,
  Line
} from 'recharts';

const VisualizarFeedbacks = () => {
  const { user, isAdmin } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksOriginais, setFeedbacksOriginais] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [buscaColaborador, setBuscaColaborador] = useState('');

  const [filtros, setFiltros] = useState({
    usuario_id: 'all',
    categoria_id: 'all',
    data_inicio: '',
    data_fim: '',
    nome_avaliador: ''
  });

  // Verificar permissões
  const podeVerFeedbacks = isAdmin && user?.pode_ver_feedbacks;

  // Filtrar colaboradores baseado na busca
  const colaboradoresFiltrados = useMemo(() => {
    if (!buscaColaborador.trim()) {
      return usuarios;
    }

    const termoBusca = buscaColaborador.toLowerCase().trim();
    return usuarios.filter(usuario => 
      usuario.nome.toLowerCase().includes(termoBusca) ||
      usuario.email.toLowerCase().includes(termoBusca) ||
      (usuario.setor && usuario.setor.toLowerCase().includes(termoBusca))
    );
  }, [usuarios, buscaColaborador]);

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      if (!podeVerFeedbacks) return;

      setLoadingData(true);
      try {
        // Carregar feedbacks
        const { data: feedbacksData, error: feedbacksError } = await feedbackService.listarFeedbacks();
        if (feedbacksError) {
          console.error('Erro ao carregar feedbacks:', feedbacksError);
        } else {
          setFeedbacks(feedbacksData || []);
          setFeedbacksOriginais(feedbacksData || []);
        }

        // Carregar usuários
        const { data: usuariosData, error: usuariosError } = await usuariosService.listarUsuarios();
        if (usuariosError) {
          console.error('Erro ao carregar usuários:', usuariosError);
        } else {
          setUsuarios(usuariosData || []);
        }

        // Carregar categorias
        const { data: categoriasData, error: categoriasError } = await categoriasFeedbackService.listarCategorias();
        if (categoriasError) {
          console.error('Erro ao carregar categorias:', categoriasError);
        } else {
          setCategorias(categoriasData || []);
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setMessage({ type: 'error', text: 'Erro ao carregar dados' });
      } finally {
        setLoadingData(false);
      }
    };

    carregarDados();
  }, [podeVerFeedbacks]);

  // Verificar permissões
  if (!podeVerFeedbacks) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Você não tem permissão para acessar esta página. Apenas administradores com permissão "ver feedbacks" podem visualizar feedbacks.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleFiltroChange = (field, value) => {
    setFiltros(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const aplicarFiltros = async () => {
    setLoading(true);
    try {
      const filtrosParaAPI = {
        ...filtros,
        usuario_id: filtros.usuario_id === 'all' ? '' : filtros.usuario_id,
        categoria_id: filtros.categoria_id === 'all' ? '' : filtros.categoria_id
      };

      const { data, error } = await feedbackService.listarFeedbacks(filtrosParaAPI);
      if (error) {
        setMessage({ type: 'error', text: error });
      } else {
        setFeedbacks(data || []);
        setMessage({ type: '', text: '' });
      }
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      setMessage({ type: 'error', text: 'Erro ao aplicar filtros' });
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = async () => {
    setFiltros({
      usuario_id: 'all',
      categoria_id: 'all',
      data_inicio: '',
      data_fim: '',
      nome_avaliador: ''
    });
    setBuscaColaborador('');
    
    setFeedbacks(feedbacksOriginais);
    setMessage({ type: '', text: '' });
  };

  const exportarCSV = async () => {
    try {
      const filtrosParaAPI = {
        ...filtros,
        usuario_id: filtros.usuario_id === 'all' ? '' : filtros.usuario_id,
        categoria_id: filtros.categoria_id === 'all' ? '' : filtros.categoria_id
      };

      const { data, error } = await feedbackService.exportarCSV(filtrosParaAPI);
      if (error) {
        setMessage({ type: 'error', text: error });
        return;
      }

      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `feedbacks_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage({ type: 'success', text: 'Arquivo CSV exportado com sucesso!' });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      setMessage({ type: 'error', text: 'Erro ao exportar arquivo' });
    }
  };

  // ===== DADOS CALCULADOS COM CATEGORIAS REAIS =====
  
  // Gráfico de pizza - usar categorias reais
  const dadosGraficoCategoria = useMemo(() => {
    const categoriaCount = {};
    
    feedbacks.forEach(feedback => {
      const categoriaNome = feedback.categoria_nome;
      if (categoriaNome) {
        categoriaCount[categoriaNome] = (categoriaCount[categoriaNome] || 0) + 1;
      }
    });

    return Object.entries(categoriaCount).map(([nome, count]) => {
      const categoria = categorias.find(c => c.nome === nome);
      return {
        name: nome,
        value: count,
        color: categoria?.cor || '#8884d8'
      };
    }).sort((a, b) => b.value - a.value);
  }, [feedbacks, categorias]);

  // CORRIGIDO: Gráfico mensal - usar categorias reais, não tipos artificiais
  const dadosGraficoMensal = useMemo(() => {
    const feedbacksPorMes = {};
    
    feedbacks.forEach(feedback => {
      const data = new Date(feedback.created_at);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const categoriaNome = feedback.categoria_nome;
      
      if (!feedbacksPorMes[chave]) {
        feedbacksPorMes[chave] = {
          mes: chave,
          total: 0,
          categorias: {}
        };
      }
      
      feedbacksPorMes[chave].total++;
      
      // Contar por categoria real
      if (categoriaNome) {
        feedbacksPorMes[chave].categorias[categoriaNome] = 
          (feedbacksPorMes[chave].categorias[categoriaNome] || 0) + 1;
      }
    });

    // Converter para formato do gráfico
    return Object.values(feedbacksPorMes)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map(stat => {
        const resultado = {
          mes: new Date(stat.mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          total: stat.total
        };
        
        // Adicionar cada categoria como uma propriedade
        Object.entries(stat.categorias).forEach(([categoria, count]) => {
          resultado[categoria] = count;
        });
        
        return resultado;
      });
  }, [feedbacks]);

  // Cores para o gráfico mensal baseadas nas categorias reais
  const coresGraficoMensal = useMemo(() => {
    const cores = {};
    categorias.forEach(categoria => {
      cores[categoria.nome] = categoria.cor;
    });
    return cores;
  }, [categorias]);

  // Estatísticas por usuário - usar categorias reais
  const estatisticasPorUsuario = useMemo(() => {
    const estatisticas = {};
    
    feedbacks.forEach(feedback => {
      const userId = feedback.usuario_id;
      const userName = feedback.usuario_nome;
      const categoriaNome = feedback.categoria_nome;
      
      if (!estatisticas[userId]) {
        estatisticas[userId] = {
          usuario_nome: userName,
          total_feedbacks: 0,
          categorias: {}
        };
      }
      
      estatisticas[userId].total_feedbacks++;
      
      // Contar por categoria real
      if (categoriaNome) {
        estatisticas[userId].categorias[categoriaNome] = 
          (estatisticas[userId].categorias[categoriaNome] || 0) + 1;
      }
    });

    return Object.values(estatisticas).sort((a, b) => b.total_feedbacks - a.total_feedbacks);
  }, [feedbacks]);

  // Resumo geral - usar categorias reais
  const resumoGeral = useMemo(() => {
    const total = feedbacks.length;
    const colaboradoresComFeedback = new Set(feedbacks.map(f => f.usuario_id)).size;
    const categoriasUsadas = new Set(feedbacks.map(f => f.categoria_id)).size;
    
    const categoriaCount = {};
    feedbacks.forEach(feedback => {
      const categoriaNome = feedback.categoria_nome;
      if (categoriaNome) {
        categoriaCount[categoriaNome] = (categoriaCount[categoriaNome] || 0) + 1;
      }
    });

    return {
      total,
      colaboradoresComFeedback,
      categoriasUsadas,
      categoriaCount
    };
  }, [feedbacks]);

  if (loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando dados...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Visualizar Feedbacks</h1>
        <p className="text-gray-600">
          Visualize, filtre e analise todos os feedbacks registrados no sistema.
        </p>
      </div>

      {/* Mensagem de status */}
      {message.text && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
          <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
            {(filtros.usuario_id !== 'all' || filtros.categoria_id !== 'all' || filtros.data_inicio || filtros.data_fim || filtros.nome_avaliador) && (
              <Badge variant="secondary" className="ml-2">
                Filtros ativos
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Filtro por usuário com busca */}
            <div className="space-y-2">
              <Label>Colaborador</Label>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={buscaColaborador}
                  onChange={(e) => setBuscaColaborador(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filtros.usuario_id} onValueChange={(value) => handleFiltroChange('usuario_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os colaboradores" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">Todos os colaboradores</SelectItem>
                  {colaboradoresFiltrados.length === 0 && buscaColaborador ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Nenhum colaborador encontrado
                    </div>
                  ) : (
                    colaboradoresFiltrados.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{usuario.nome}</span>
                          <span className="text-sm text-gray-500">{usuario.email}</span>
                          {usuario.setor && (
                            <span className="text-xs text-gray-400">{usuario.setor}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {buscaColaborador && (
                <div className="text-sm text-gray-500">
                  {colaboradoresFiltrados.length} colaborador(es) encontrado(s)
                </div>
              )}
            </div>

            {/* Filtro por categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={filtros.categoria_id} onValueChange={(value) => handleFiltroChange('categoria_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: categoria.cor }}
                        />
                        <span>{categoria.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por avaliador */}
            <div className="space-y-2">
              <Label>Avaliador</Label>
              <Input
                placeholder="Nome do avaliador"
                value={filtros.nome_avaliador}
                onChange={(e) => handleFiltroChange('nome_avaliador', e.target.value)}
              />
            </div>

            {/* Data início */}
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
              />
            </div>

            {/* Data fim */}
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button onClick={aplicarFiltros} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Aplicar Filtros
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={limparFiltros} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </div>
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo rápido - usar categorias reais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{resumoGeral.total}</div>
              <div className="text-sm text-gray-500">Total de Feedbacks</div>
            </div>
          </CardContent>
        </Card>
        {Object.entries(resumoGeral.categoriaCount).slice(0, 3).map(([categoria, count], index) => {
          const categoriaInfo = categorias.find(c => c.nome === categoria);
          return (
            <Card key={categoria}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold mb-1" 
                    style={{ color: categoriaInfo?.cor || '#6b7280' }}
                  >
                    {count}
                  </div>
                  <div className="text-sm text-gray-500">{categoria}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="lista" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lista" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Lista de Feedbacks</span>
          </TabsTrigger>
          <TabsTrigger value="graficos" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Gráficos</span>
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Estatísticas</span>
          </TabsTrigger>
        </TabsList>

        {/* Lista de Feedbacks */}
        <TabsContent value="lista">
          <div className="space-y-4">
            {feedbacks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum feedback encontrado com os filtros aplicados.</p>
                </CardContent>
              </Card>
            ) : (
              feedbacks.map((feedback) => (
                <Card key={feedback.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          style={{ 
                            backgroundColor: feedback.categoria_cor,
                            color: 'white'
                          }}
                        >
                          {feedback.categoria_nome}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {feedback.created_at_formatted}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Colaborador</h3>
                        <p className="text-gray-700">{feedback.usuario_nome}</p>
                        <p className="text-sm text-gray-500">{feedback.usuario_email}</p>
                        {feedback.usuario_setor && (
                          <p className="text-sm text-gray-500">{feedback.usuario_setor}</p>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Avaliador</h3>
                        <p className="text-gray-700">{feedback.nome_avaliador}</p>
                        <p className="text-sm text-gray-500">
                          Registrado por: {feedback.admin_nome}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Relato</h3>
                      <p className="text-gray-700 leading-relaxed">{feedback.relato}</p>
                    </div>

                    {/* Resposta do usuário ao feedback */}
                    {feedback.usuario_pode_ver && feedback.feedback_respostas && feedback.feedback_respostas.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Resposta do Colaborador
                        </h4>
                        {feedback.feedback_respostas.map((resposta) => (
                          <div 
                            key={resposta.id}
                            className={`p-3 rounded-lg border-l-4 ${
                              resposta.tipo_resposta === 'concordo' 
                                ? 'bg-green-50 border-green-400' 
                                : 'bg-red-50 border-red-400'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              {resposta.tipo_resposta === 'concordo' ? (
                                <div className="flex items-center text-green-700">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="font-medium">Concordou</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-red-700">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                  <span className="font-medium">Discordou</span>
                                </div>
                              )}
                              <span className="text-xs text-gray-500">
                                em {new Date(resposta.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            {resposta.motivo_discordancia && (
                              <p className="text-gray-700 text-sm leading-relaxed">
                                <strong>Motivo:</strong> {resposta.motivo_discordancia}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Indicador se feedback é visível para o usuário */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {feedback.usuario_pode_ver ? (
                            <span className="text-green-600">✅ Visível para o colaborador</span>
                          ) : (
                            <span className="text-gray-500">🔒 Feedback privado</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Gráficos */}
        <TabsContent value="graficos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de pizza - categorias reais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Feedbacks por Categoria</span>
                  {(filtros.usuario_id !== 'all' || filtros.categoria_id !== 'all' || filtros.data_inicio || filtros.data_fim || filtros.nome_avaliador) && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Filtrado
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dadosGraficoCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={dadosGraficoCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dadosGraficoCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    Nenhum dado disponível para exibir
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CORRIGIDO: Gráfico mensal - categorias reais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Feedbacks por Mês</span>
                  {(filtros.usuario_id !== 'all' || filtros.categoria_id !== 'all' || filtros.data_inicio || filtros.data_fim || filtros.nome_avaliador) && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Filtrado
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dadosGraficoMensal.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosGraficoMensal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis allowDecimals={false} domain={[0, 'dataMax']} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#8884d8" name="Total" />
                      {/* Barras dinâmicas para cada categoria */}
                      {categorias.map((categoria) => (
                        <Bar 
                          key={categoria.nome}
                          dataKey={categoria.nome} 
                          fill={categoria.cor} 
                          name={categoria.nome} 
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    Nenhum dado disponível para exibir
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Estatísticas */}
        <TabsContent value="estatisticas">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estatísticas por usuário - categorias reais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Estatísticas por Colaborador</span>
                  {(filtros.usuario_id !== 'all' || filtros.categoria_id !== 'all' || filtros.data_inicio || filtros.data_fim || filtros.nome_avaliador) && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Filtrado
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {estatisticasPorUsuario.length > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {estatisticasPorUsuario.map((stat, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <h4 className="font-semibold text-gray-900 mb-2">{stat.usuario_nome}</h4>
                        <div className="text-center mb-2">
                          <div className="text-lg font-bold text-blue-600">{stat.total_feedbacks}</div>
                          <div className="text-xs text-gray-500">Total de Feedbacks</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(stat.categorias).map(([categoria, count]) => {
                            const categoriaInfo = categorias.find(c => c.nome === categoria);
                            return (
                              <div key={categoria} className="text-center">
                                <div 
                                  className="text-sm font-bold"
                                  style={{ color: categoriaInfo?.cor || '#6b7280' }}
                                >
                                  {count}
                                </div>
                                <div className="text-xs text-gray-500">{categoria}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    Nenhuma estatística disponível
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo detalhado - categorias reais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Resumo Detalhado</span>
                  {(filtros.usuario_id !== 'all' || filtros.categoria_id !== 'all' || filtros.data_inicio || filtros.data_fim || filtros.nome_avaliador) && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Filtrado
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">{resumoGeral.total}</div>
                    <div className="text-gray-600">Total de Feedbacks</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{resumoGeral.colaboradoresComFeedback}</div>
                      <div className="text-sm text-gray-500">Colaboradores com Feedback</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{resumoGeral.categoriasUsadas}</div>
                      <div className="text-sm text-gray-500">Categorias Utilizadas</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Distribuição por Categoria</h5>
                    <div className="space-y-3">
                      {Object.entries(resumoGeral.categoriaCount).map(([categoria, count]) => {
                        const categoriaInfo = categorias.find(c => c.nome === categoria);
                        const percentual = resumoGeral.total > 0 ? ((count / resumoGeral.total) * 100).toFixed(1) : 0;
                        return (
                          <div key={categoria} className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: categoriaInfo?.cor || '#6b7280' }}
                              />
                              <span className="text-sm text-gray-600">{categoria}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span 
                                className="font-semibold"
                                style={{ color: categoriaInfo?.cor || '#6b7280' }}
                              >
                                {count}
                              </span>
                              <span className="text-xs text-gray-500">({percentual}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {dadosGraficoMensal.length > 0 && (
                    <div className="border-t pt-4">
                      <h5 className="font-semibold text-gray-900 mb-3">Últimos Meses</h5>
                      <div className="space-y-2">
                        {dadosGraficoMensal.slice(-3).map((stat, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{stat.mes}</span>
                            <span className="font-semibold">{stat.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisualizarFeedbacks;