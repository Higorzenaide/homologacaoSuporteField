import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usuariosService } from '../services/usuariosService';
import { categoriasFeedbackService } from '../services/categoriasFeedbackService';
import { feedbackService } from '../services/feedbackService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Send, User, MessageSquare, Tag, UserCheck } from 'lucide-react';

const InserirFeedback = () => {
  const { user, isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    usuario_id: '',
    categoria_id: '',
    relato: '',
    nome_avaliador: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      setLoadingData(true);
      try {
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
        setMessage({ type: 'error', text: 'Erro ao carregar dados necessários' });
      } finally {
        setLoadingData(false);
      }
    };

    if (isAdmin) {
      carregarDados();
    }
  }, [isAdmin]);

  // Verificar permissões
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Você não tem permissão para acessar esta página. Apenas administradores podem inserir feedbacks.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar mensagens ao editar
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;

    // Validar dados
    const { valido, erros } = feedbackService.validarDados({
      ...formData,
      admin_id: user.id
    });

    if (!valido) {
      setMessage({ type: 'error', text: erros.join(', ') });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data, error } = await feedbackService.criarFeedback({
        ...formData,
        admin_id: user.id
      });

      if (error) {
        setMessage({ type: 'error', text: error });
      } else {
        setMessage({ type: 'success', text: 'Feedback inserido com sucesso!' });
        
        // Limpar formulário
        setFormData({
          usuario_id: '',
          categoria_id: '',
          relato: '',
          nome_avaliador: ''
        });
      }
    } catch (error) {
      console.error('Erro ao inserir feedback:', error);
      setMessage({ type: 'error', text: 'Erro interno do servidor' });
    } finally {
      setLoading(false);
    }
  };

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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inserir Feedback</h1>
          <p className="text-gray-600">
            Registre um feedback para um colaborador selecionando a categoria apropriada e fornecendo detalhes.
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

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Dados do Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção de Usuário */}
              <div className="space-y-2">
                <Label htmlFor="usuario" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Colaborador *</span>
                </Label>
                <Select 
                  value={formData.usuario_id} 
                  onValueChange={(value) => handleInputChange('usuario_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{usuario.nome}</span>
                          <span className="text-sm text-gray-500">{usuario.email}</span>
                          {usuario.setor && (
                            <span className="text-xs text-gray-400">{usuario.setor}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seleção de Categoria */}
              <div className="space-y-2">
                <Label htmlFor="categoria" className="flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span>Categoria *</span>
                </Label>
                <Select 
                  value={formData.categoria_id} 
                  onValueChange={(value) => handleInputChange('categoria_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
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

              {/* Nome do Avaliador */}
              <div className="space-y-2">
                <Label htmlFor="avaliador" className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Nome do Avaliador *</span>
                </Label>
                <Input
                  id="avaliador"
                  type="text"
                  placeholder="Digite o nome de quem deu o feedback"
                  value={formData.nome_avaliador}
                  onChange={(e) => handleInputChange('nome_avaliador', e.target.value)}
                  maxLength={255}
                />
              </div>

              {/* Relato do Feedback */}
              <div className="space-y-2">
                <Label htmlFor="relato" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Relato do Feedback *</span>
                </Label>
                <Textarea
                  id="relato"
                  placeholder="Descreva detalhadamente o feedback..."
                  value={formData.relato}
                  onChange={(e) => handleInputChange('relato', e.target.value)}
                  rows={6}
                  maxLength={2000}
                  className="resize-none"
                />
                <div className="text-sm text-gray-500 text-right">
                  {formData.relato.length}/2000 caracteres
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      usuario_id: '',
                      categoria_id: '',
                      relato: '',
                      nome_avaliador: ''
                    });
                    setMessage({ type: '', text: '' });
                  }}
                  disabled={loading}
                >
                  Limpar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inserindo...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Inserir Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Categorias de Feedback</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categorias.map((categoria) => (
                <div key={categoria.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: categoria.cor }}
                  />
                  <div>
                    <div className="font-medium text-sm">{categoria.nome}</div>
                    {categoria.descricao && (
                      <div className="text-xs text-gray-600">{categoria.descricao}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InserirFeedback;

