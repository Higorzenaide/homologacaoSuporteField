import React, { useState, useEffect } from 'react';
import { categoriasFeedbackService } from '../services/categoriasFeedbackService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  Tag,
  Palette
} from 'lucide-react';

const GerenciadorCategoriasFeedback = ({ isOpen, onClose }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#6B7280',
    ativo: true
  });

  // Carregar categorias
  useEffect(() => {
    if (isOpen) {
      carregarCategorias();
    }
  }, [isOpen]);

  const carregarCategorias = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await categoriasFeedbackService.listarTodasCategorias();
      if (error) {
        setMessage({ type: 'error', text: error });
      } else {
        setCategorias(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar categorias' });
    } finally {
      setLoadingData(false);
    }
  };

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
    const { valido, erros } = categoriasFeedbackService.validarDados(formData, editingId !== null);

    if (!valido) {
      setMessage({ type: 'error', text: erros.join(', ') });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let result;
      if (editingId) {
        result = await categoriasFeedbackService.atualizarCategoria(editingId, formData);
      } else {
        result = await categoriasFeedbackService.criarCategoria(formData);
      }

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ 
          type: 'success', 
          text: editingId ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!' 
        });
        
        // Recarregar categorias
        await carregarCategorias();
        
        // Resetar formulário
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      setMessage({ type: 'error', text: 'Erro interno do servidor' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (categoria) => {
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      cor: categoria.cor,
      ativo: categoria.ativo
    });
    setEditingId(categoria.id);
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleToggleAtivo = async (categoria) => {
    setLoading(true);
    try {
      const result = categoria.ativo 
        ? await categoriasFeedbackService.desativarCategoria(categoria.id)
        : await categoriasFeedbackService.reativarCategoria(categoria.id);

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ 
          type: 'success', 
          text: categoria.ativo ? 'Categoria desativada!' : 'Categoria reativada!' 
        });
        await carregarCategorias();
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      setMessage({ type: 'error', text: 'Erro interno do servidor' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoria) => {
    if (!confirm(`Tem certeza que deseja deletar a categoria "${categoria.nome}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await categoriasFeedbackService.deletarCategoria(categoria.id);
      if (error) {
        setMessage({ type: 'error', text: error });
      } else {
        setMessage({ type: 'success', text: 'Categoria deletada com sucesso!' });
        await carregarCategorias();
      }
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      setMessage({ type: 'error', text: 'Erro interno do servidor' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      cor: '#6B7280',
      ativo: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const coresPadrao = categoriasFeedbackService.getCoresPadrao();

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Gerenciar Categorias de Feedback</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mensagem de status */}
          {message.text && (
            <Alert className={`${message.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Botão para adicionar nova categoria */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Categorias de Feedback</h3>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </div>

          {/* Formulário */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingId ? 'Editar Categoria' : 'Nova Categoria'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nome */}
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        type="text"
                        placeholder="Nome da categoria"
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        maxLength={100}
                        required
                      />
                    </div>

                    {/* Cor */}
                    <div className="space-y-2">
                      <Label htmlFor="cor" className="flex items-center space-x-2">
                        <Palette className="h-4 w-4" />
                        <span>Cor</span>
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="cor"
                          type="color"
                          value={formData.cor}
                          onChange={(e) => handleInputChange('cor', e.target.value)}
                          className="w-16 h-10"
                        />
                        <div className="flex flex-wrap gap-1">
                          {coresPadrao.slice(0, 5).map((cor) => (
                            <button
                              key={cor.valor}
                              type="button"
                              className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                              style={{ backgroundColor: cor.valor }}
                              onClick={() => handleInputChange('cor', cor.valor)}
                              title={cor.nome}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      placeholder="Descrição da categoria (opcional)"
                      value={formData.descricao}
                      onChange={(e) => handleInputChange('descricao', e.target.value)}
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {editingId ? 'Atualizar' : 'Criar'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lista de categorias */}
          <Card>
            <CardContent className="pt-6">
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Carregando categorias...</span>
                </div>
              ) : categorias.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma categoria encontrada
                </div>
              ) : (
                <div className="space-y-3">
                  {categorias.map((categoria) => (
                    <div
                      key={categoria.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: categoria.cor }}
                        />
                        <div>
                          <div className="font-medium">{categoria.nome}</div>
                          {categoria.descricao && (
                            <div className="text-sm text-gray-600">{categoria.descricao}</div>
                          )}
                        </div>
                        <Badge variant={categoria.ativo ? 'default' : 'secondary'}>
                          {categoria.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(categoria)}
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAtivo(categoria)}
                          disabled={loading}
                        >
                          {categoria.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(categoria)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GerenciadorCategoriasFeedback;

