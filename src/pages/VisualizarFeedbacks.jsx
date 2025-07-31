import React, { useState, useEffect } from 'react';
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
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [estatisticasGerais, setEstatisticasGerais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [filtros, setFiltros] = useState({
    usuario_id: '',
    categoria_id: '',
    data_inicio: '',
    data_fim: '',
    nome_avaliador: ''
  });

  // Verificar permissões
  const podeVerFeedbacks = isAdmin && user?.pode_ver_feedbacks;

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

        // Carregar estatísticas por usuário
        const { data: estatisticasData, error: estatisticasError } = await feedbackService.obterEstatisticasUsuario();
        if (estatisticasError) {
          console.error('Erro ao carregar estatísticas:', estatisticasError);
        } else {
          setEstatisticas(estatisticasData || []);
        }

        // Carregar estatísticas gerais
        const { data: estatisticasGeraisData, error: estatisticasGeraisError } = await feedbackService.obterEstatisticasGerais();
        if (estatisticasGeraisError) {
          console.error('Erro ao carregar estatísticas gerais:', estatisticasGeraisError);
        } else {
          setEstatisticasGerais(estatisticasGeraisData || []);
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
      const { data, error } = await feedbackService.listarFeedbacks(filtros);
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
      usuario_id: '',
      categoria_id: '',
      data_inicio: '',
      data_fim: '',
      nome_avaliador: ''
    });
    
    setLoading(true);
    try {
      const { data, error } = await feedbackService.listarFeedbacks();
      if (error) {
        setMessage({ type: 'error', text: error });
      } else {
        setFeedbacks(data || []);
        setMessage({ type: '', text: '' });
      }
    } catch (error) {
      console.error('Erro ao limpar filtros:', error);
      setMessage({ type: 'error', text: 'Erro ao limpar filtros' });
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = async () => {
    try {
      const { data, error } = await feedbackService.exportarCSV(filtros);
      if (error) {
        setMessage({ type: 'error', text: error });
        return;
      }

      // Criar e baixar arquivo
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

  // Preparar dados para gráficos
  const dadosGraficoCategoria = categorias.map(categoria => {
    const count = feedbacks.filter(f => f.categoria_nome === categoria.nome).length;
    return {
      name: categoria.nome,
      value: count,
      color: categoria.cor
    };
  }).filter(item => item.value > 0);

  const dadosGraficoMensal = estatisticasGerais.map(stat => ({
    mes: new Date(stat.mes).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
    total: stat.total_feedbacks,
    positivos: stat.total_positivos,
    negativos: stat.total_negativos,
    construtivos: stat.total_construtivos
  }));

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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Filtro por usuário */}
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select value={filtros.usuario_id} onValueChange={(value) => handleFiltroChange('usuario_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os colaboradores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os colaboradores</SelectItem>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={filtros.categoria_id} onValueChange={(value) => handleFiltroChange('categoria_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
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
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Gráficos */}
        <TabsContent value="graficos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de pizza - Feedbacks por categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Feedbacks por Categoria</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={dadosGraficoCategoria}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosGraficoCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de barras - Feedbacks por categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Quantidade por Categoria</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosGraficoCategoria}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {dadosGraficoCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de linha - Evolução mensal */}
            {dadosGraficoMensal.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Evolução Mensal de Feedbacks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dadosGraficoMensal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
                      <Line type="monotone" dataKey="positivos" stroke="#10B981" name="Positivos" />
                      <Line type="monotone" dataKey="negativos" stroke="#EF4444" name="Negativos" />
                      <Line type="monotone" dataKey="construtivos" stroke="#F59E0B" name="Construtivos" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Estatísticas */}
        <TabsContent value="estatisticas">
          <div className="space-y-6">
            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Feedbacks</p>
                      <p className="text-2xl font-bold text-gray-900">{feedbacks.length}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Colaboradores</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {new Set(feedbacks.map(f => f.usuario_id)).size}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Feedbacks Positivos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {feedbacks.filter(f => f.categoria_nome === 'Positivo').length}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">% Positivos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {feedbacks.length > 0 ? 
                          Math.round((feedbacks.filter(f => f.categoria_nome === 'Positivo').length / feedbacks.length) * 100) 
                          : 0}%
                      </p>
                    </div>
                    <PieChart className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de estatísticas por usuário */}
            {estatisticas && estatisticas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas por Colaborador</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Colaborador</th>
                          <th className="text-left py-2">Setor</th>
                          <th className="text-center py-2">Total</th>
                          <th className="text-center py-2">Positivos</th>
                          <th className="text-center py-2">Negativos</th>
                          <th className="text-center py-2">Construtivos</th>
                          <th className="text-center py-2">% Positivos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estatisticas.map((stat) => (
                          <tr key={stat.usuario_id} className="border-b">
                            <td className="py-2 font-medium">{stat.usuario_nome}</td>
                            <td className="py-2 text-gray-600">{stat.usuario_setor || '-'}</td>
                            <td className="py-2 text-center">{stat.total_feedbacks}</td>
                            <td className="py-2 text-center text-green-600">{stat.feedbacks_positivos}</td>
                            <td className="py-2 text-center text-red-600">{stat.feedbacks_negativos}</td>
                            <td className="py-2 text-center text-yellow-600">{stat.feedbacks_construtivos}</td>
                            <td className="py-2 text-center font-medium">
                              {stat.percentual_positivos || 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisualizarFeedbacks;

