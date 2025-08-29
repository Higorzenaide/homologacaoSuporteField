import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usuariosService } from '../services/usuariosService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  Loader2, 
  Search, 
  UserPlus, 
  Edit, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone,
  CheckCircle,
  AlertCircle, 
  Briefcase,
  Shield,
  User,
  Calendar,
  Eye,
  EyeOff,
  Shuffle,
  Trash2
} from 'lucide-react';
import EmailConfirmationModal from '../components/EmailConfirmationModal';
import securityService from '../services/securityService';

const Usuarios = () => {
  const { isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [createdUserData, setCreatedUserData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    nome: '',
    cargo: '',
    telefone: '',
    tipo_usuario: 'usuario',
    ativo: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Verificar se usuário é admin
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-500 bg-red-50">
          <AlertDescription className="text-red-700">
            Acesso negado. Apenas administradores podem gerenciar usuários.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Carregar usuários
  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const result = await usuariosService.listarUsuarios();
      if (result.error) {
        setError(result.error);
      } else {
        setUsuarios(result.data || []);
      }
    } catch (error) {
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuários baseado na busca e filtros
  const usuariosFiltrados = useMemo(() => {
    let resultado = usuarios;

    // Filtro por busca
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase().trim();
      resultado = resultado.filter(usuario => 
        usuario.nome.toLowerCase().includes(termoBusca) ||
        usuario.email.toLowerCase().includes(termoBusca) ||
        (usuario.cargo && usuario.cargo.toLowerCase().includes(termoBusca)) ||
        (usuario.telefone && usuario.telefone.includes(termoBusca))
      );
    }

    // Filtro por tipo
    if (filtroTipo !== 'all') {
      resultado = resultado.filter(usuario => usuario.tipo_usuario === filtroTipo);
    }

    // Filtro por status
    if (filtroStatus !== 'all') {
      const statusAtivo = filtroStatus === 'ativo';
      resultado = resultado.filter(usuario => usuario.ativo === statusAtivo);
    }

    return resultado;
  }, [usuarios, busca, filtroTipo, filtroStatus]);

  // Formatação de telefone brasileiro
  const formatarTelefone = (valor) => {
    // Remove tudo que não é número
    const numeros = valor.replace(/\D/g, '');
    
    // Aplica a máscara
    if (numeros.length <= 10) {
      // Formato: (XX) XXXX-XXXX
      return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, (match, p1, p2, p3) => {
        if (p3) return `(${p1}) ${p2}-${p3}`;
        if (p2) return `(${p1}) ${p2}`;
        if (p1) return `(${p1}`;
        return numeros;
      });
    } else {
      // Formato: (XX) XXXXX-XXXX
      return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, (match, p1, p2, p3) => {
        if (p3) return `(${p1}) ${p2}-${p3}`;
        if (p2) return `(${p1}) ${p2}`;
        if (p1) return `(${p1}`;
        return numeros;
      });
    }
  };

  const handleTelefoneChange = (e) => {
    const valorFormatado = formatarTelefone(e.target.value);
    setFormData({ ...formData, telefone: valorFormatado });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Validar dados
      const validacao = usuariosService.validarDados(formData, !!editingUser);
      if (!validacao.valido) {
        setError(validacao.erros.join(', '));
        return;
      }

      let result;
      if (editingUser) {
        // Atualizar usuário existente
        result = await usuariosService.atualizarUsuario(editingUser.id, formData);
      } else {
        // Criar novo usuário
        result = await usuariosService.criarUsuario(formData);
      }

      if (result.error) {
        setError(result.error);
      } else {
        if (editingUser) {
          // Usuário atualizado
          setSuccess('Usuário atualizado com sucesso!');
          setShowModal(false);
          setEditingUser(null);
          resetForm();
          carregarUsuarios();
        } else {
          // Novo usuário criado - mostrar modal de confirmação de email
          setCreatedUserData({
            email: formData.email,
            nome: formData.nome,
            tipo_usuario: formData.tipo_usuario
          });
          setShowModal(false);
          setEditingUser(null);
          resetForm();
          carregarUsuarios();
          setShowEmailConfirmation(true);
        }
      }
    } catch (error) {
      setError('Erro interno do servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      email: usuario.email,
      senha: '', // Não preencher senha na edição
      nome: usuario.nome,
      cargo: usuario.cargo || '',
      telefone: usuario.telefone || '',
      tipo_usuario: usuario.tipo_usuario,
      ativo: usuario.ativo
    });
    setShowModal(true);
  };

  // CORRIGIDO: Função para abrir modal de novo usuário
  const handleNovoUsuario = () => {
    // Limpar completamente o estado antes de abrir o modal
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const handleToggleStatus = async (usuario) => {
    try {
      const result = usuario.ativo 
        ? await usuariosService.desativarUsuario(usuario.id)
        : await usuariosService.reativarUsuario(usuario.id);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`Usuário ${usuario.ativo ? 'desativado' : 'reativado'} com sucesso!`);
        carregarUsuarios();
      }
    } catch (error) {
      setError('Erro ao alterar status do usuário');
    }
  };

  const handleDeleteUser = (usuario) => {
    setUserToDelete(usuario);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setDeleting(true);
    try {
      const result = await usuariosService.excluirUsuario(userToDelete.id);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`Usuário "${userToDelete.nome}" excluído com sucesso!`);
        carregarUsuarios();
        setShowDeleteModal(false);
        setUserToDelete(null);
      }
    } catch (error) {
      setError('Erro ao excluir usuário');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      senha: '',
      nome: '',
      cargo: '',
      telefone: '',
      tipo_usuario: 'usuario',
      ativo: true
    });
    setError('');
    setSuccess('');
    setMostrarSenha(false);
  };

  // CORRIGIDO: Função para fechar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    resetForm();
  };

  // CORRIGIDO: Controlar abertura/fechamento do modal
  const handleModalChange = (open) => {
    if (!open) {
      // Ao fechar o modal, limpar tudo
      handleCloseModal();
    }
    setShowModal(open);
  };

  const gerarSenhaTemporaria = () => {
    const senha = usuariosService.gerarSenhaTemporaria();
    setFormData({ ...formData, senha });
  };

  const limparFiltros = () => {
    setBusca('');
    setFiltroTipo('all');
    setFiltroStatus('all');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando usuários...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Usuários</h1>
            <p className="text-gray-600">
              Gerencie usuários do sistema, suas permissões e informações.
            </p>
          </div>
          {/* CORRIGIDO: Botão que chama handleNovoUsuario */}
          <Button 
            onClick={handleNovoUsuario}
            className="bg-red-600 hover:bg-red-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{usuarios.length}</div>
                <div className="text-sm text-gray-500">Total de Usuários</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {usuarios.filter(u => u.ativo).length}
                </div>
                <div className="text-sm text-gray-500">Usuários Ativos</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {usuarios.filter(u => u.tipo_usuario === 'admin').length}
                </div>
                <div className="text-sm text-gray-500">Administradores</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {usuarios.filter(u => u.tipo_usuario === 'usuario').length}
                </div>
                <div className="text-sm text-gray-500">Usuários Comuns</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mensagens de status */}
      {error && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Filtros e busca */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Buscar e Filtrar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Campo de busca */}
            <div className="md:col-span-2">
              <Label>Buscar usuários</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nome, email, cargo ou telefone..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por tipo */}
            <div>
              <Label>Tipo de usuário</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="usuario">Usuários</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por status */}
            <div>
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {usuariosFiltrados.length} usuário(s) encontrado(s)
              {(busca || filtroTipo !== 'all' || filtroStatus !== 'all') && (
                <span className="ml-2">
                  <Badge variant="secondary">Filtros aplicados</Badge>
                </span>
              )}
            </div>
            {(busca || filtroTipo !== 'all' || filtroStatus !== 'all') && (
              <Button variant="outline" size="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuários em cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {usuariosFiltrados.map((usuario) => {
          const formatted = usuariosService.formatarParaExibicao(usuario);
          return (
            <Card key={usuario.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      {usuario.tipo_usuario === 'admin' ? (
                        <Shield className="h-6 w-6 text-purple-600" />
                      ) : (
                        <User className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{usuario.nome}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={usuario.tipo_usuario === 'admin' ? 'default' : 'secondary'}
                          className={usuario.tipo_usuario === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}
                        >
                          {formatted.tipo_usuario_label}
                        </Badge>
                        <Badge 
                          variant={usuario.ativo ? 'default' : 'destructive'}
                          className={usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {formatted.ativo_label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{usuario.email}</span>
                  </div>
                  
                  {usuario.cargo && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Briefcase className="h-4 w-4" />
                      <span>{usuario.cargo}</span>
                    </div>
                  )}
                  
                  {usuario.telefone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{usuario.telefone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Último acesso: {formatted.ultimo_acesso_formatted}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(usuario)}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button 
                    variant={usuario.ativo ? "destructive" : "default"}
                    size="sm" 
                    onClick={() => handleToggleStatus(usuario)}
                    className="flex-1"
                  >
                    {usuario.ativo ? (
                      <>
                        <UserX className="mr-2 h-4 w-4" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Reativar
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteUser(usuario)}
                    className="px-3"
                    title="Excluir usuário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {usuariosFiltrados.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              {busca || filtroTipo !== 'all' || filtroStatus !== 'all' 
                ? 'Nenhum usuário encontrado com os filtros aplicados.'
                : 'Nenhum usuário cadastrado no sistema.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* CORRIGIDO: Modal com controle adequado de abertura/fechamento */}
      <Dialog open={showModal} onOpenChange={handleModalChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {editingUser ? (
                <>
                  <Edit className="h-5 w-5" />
                  <span>Editar Usuário</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  <span>Novo Usuário</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    placeholder="usuario@empresa.com"
                    required
                    disabled={!!editingUser} // Não permitir editar email
                  />
                </div>
              </div>

              <div>
                <Label>Nome completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="pl-10"
                    placeholder="Nome do usuário"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Cargo</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="pl-10"
                    placeholder="Cargo do usuário"
                  />
                </div>
              </div>

              <div>
                <Label>Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="tel"
                    value={formData.telefone}
                    onChange={handleTelefoneChange}
                    className="pl-10"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>

              <div>
                <Label>
                  Senha {editingUser && '(deixe em branco para manter atual)'}
                </Label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      type={mostrarSenha ? "text" : "password"}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Clique no ícone para gerar senha segura ou digite sua própria"
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={gerarSenhaTemporaria}
                    className="px-3"
                    title="Gerar senha segura"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Critérios de senha dinâmicos */}
                {formData.senha && !editingUser && (() => {
                  const validation = securityService.validatePassword(formData.senha);
                  const { valida, criterios } = validation || { valida: false, criterios: {} };
                  
                  return (
                    <div className="mt-3 p-3 bg-gray-50 border rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Critérios de segurança:
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className={`flex items-center ${criterios?.tamanho ? 'text-green-600' : 'text-red-500'}`}>
                          {criterios?.tamanho ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mr-1" />
                          )}
                          Mín. 8 caracteres
                        </div>
                        
                        <div className={`flex items-center ${criterios?.maiuscula ? 'text-green-600' : 'text-red-500'}`}>
                          {criterios?.maiuscula ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mr-1" />
                          )}
                          Letra maiúscula
                        </div>
                        
                        <div className={`flex items-center ${criterios?.minuscula ? 'text-green-600' : 'text-red-500'}`}>
                          {criterios?.minuscula ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mr-1" />
                          )}
                          Letra minúscula
                        </div>
                        
                        <div className={`flex items-center ${criterios?.numero ? 'text-green-600' : 'text-red-500'}`}>
                          {criterios?.numero ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mr-1" />
                          )}
                          Número
                        </div>
                        
                        <div className={`flex items-center ${criterios?.especial ? 'text-green-600' : 'text-red-500'}`}>
                          {criterios?.especial ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mr-1" />
                          )}
                          Caract. especial
                        </div>
                        
                        <div className={`flex items-center ${criterios?.semEspacos ? 'text-green-600' : 'text-red-500'}`}>
                          {criterios?.semEspacos ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mr-1" />
                          )}
                          Sem espaços
                        </div>
                      </div>
                      
                      {valida && (
                        <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded flex items-center text-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Senha atende todos os critérios!</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <Label>Tipo de usuário</Label>
                <Select 
                  value={formData.tipo_usuario} 
                  onValueChange={(value) => setFormData({ ...formData, tipo_usuario: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usuario">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Usuário</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Administrador</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingUser && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="ativo">Usuário ativo</Label>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingUser ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Email */}
      <EmailConfirmationModal
        isOpen={showEmailConfirmation}
        onClose={() => setShowEmailConfirmation(false)}
        userData={createdUserData}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Excluir Usuário
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-red-900 mb-1">Ação Irreversível!</h4>
                  <p className="text-sm text-red-700">
                    Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema.
                  </p>
                </div>
              </div>
            </div>

            {userToDelete && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Usuário a ser excluído:</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {userToDelete.tipo_usuario === 'admin' ? (
                      <Shield className="h-5 w-5 text-purple-600" />
                    ) : (
                      <User className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{userToDelete.nome}</p>
                    <p className="text-sm text-gray-600">{userToDelete.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={userToDelete.tipo_usuario === 'admin' ? 'default' : 'secondary'}>
                        {userToDelete.tipo_usuario === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                      <Badge variant={userToDelete.ativo ? 'default' : 'destructive'}>
                        {userToDelete.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">O que será removido:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Dados pessoais e credenciais</li>
                    <li>• Histórico de atividades</li>
                    <li>• Associações com treinamentos</li>
                    <li>• Configurações de notificação</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={cancelDeleteUser}
              disabled={deleting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleting}
              className="flex-1"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Permanentemente
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;
