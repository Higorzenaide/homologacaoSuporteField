import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Check, X, Calendar, Activity, UserCheck } from 'lucide-react';
import { useCachedUsuarios } from '../services/cachedServices';
// FORÇA BUILD UPDATE - ultimo_acesso corrigido definitivamente

const NotificationTargetSelector = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Selecionar Usuários para Notificação",
  subtitle = "Escolha quais usuários devem receber esta notificação"
}) => {
  // Usar cache de usuários ao invés de carregamento direto
  const { data: users = [], isLoading: loading, error } = useCachedUsuarios();
  
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    withLogin: 0,
    admins: 0
  });

  // Calcular estatísticas quando users mudar
  useEffect(() => {
    if (users && users.length > 0) {
      const newStats = {
        total: users.length,
        active: users.filter(u => u.ativo).length,
        withLogin: users.filter(u => u.ultimo_acesso).length,
        admins: users.filter(u => u.tipo_usuario === 'admin').length
      };
      setStats(newStats);
    }
  }, [users]);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, activeFilter]);



  const applyFilters = () => {
    // Verificar se users é válido antes de usar
    if (!users || !Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = [...users];

    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtros especiais
    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter(user => user.ativo);
        break;
      case 'with_login':
        filtered = filtered.filter(user => user.ultimo_acesso);
        break;
      case 'recent_login':
        // Usuários que acessaram nos últimos 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(user => 
          user.ultimo_acesso && new Date(user.ultimo_acesso) > thirtyDaysAgo
        );
        break;
      case 'admins':
        filtered = filtered.filter(user => user.tipo_usuario === 'admin');
        break;
      case 'non_admins':
        filtered = filtered.filter(user => user.tipo_usuario !== 'admin');
        break;
      case 'never_logged':
        filtered = filtered.filter(user => !user.ultimo_acesso);
        break;
      default:
        // 'all' - não filtrar
        break;
    }

    setFilteredUsers(filtered);
  };

  const toggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    setSelectedUsers(filteredUsers.map(user => user.id));
  };

  const selectNone = () => {
    setSelectedUsers([]);
  };

  const handleConfirm = () => {
    const selectedUserData = (users || []).filter(user => selectedUsers.includes(user.id));
    onConfirm(selectedUsers, selectedUserData);
    onClose();
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Nunca';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays} dias atrás`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} semanas atrás`;
    return `${Math.ceil(diffDays / 30)} meses atrás`;
  };

  const filterOptions = [
    { value: 'all', label: 'Todos os Usuários', icon: Users, count: stats.total },
    { value: 'active', label: 'Usuários Ativos', icon: UserCheck, count: stats.active },
    { value: 'with_login', label: 'Com Login Feito', icon: Activity, count: stats.withLogin },
    { value: 'recent_login', label: 'Login Recente (30 dias)', icon: Calendar, count: 0 },
    { value: 'admins', label: 'Apenas Admins', icon: Users, count: stats.admins },
    { value: 'non_admins', label: 'Apenas Usuários', icon: Users, count: stats.total - stats.admins },
    { value: 'never_logged', label: 'Nunca Logaram', icon: X, count: stats.total - stats.withLogin }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-blue-100 mt-1">{subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="p-6 border-b border-gray-200">
          {/* Busca */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {filterOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setActiveFilter(option.value)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    activeFilter === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-4 h-4" />
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{option.count}</div>
                </button>
              );
            })}
          </div>

          {/* Ações de Seleção */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Selecionar Todos ({filteredUsers.length})
              </button>
              <button
                onClick={selectNone}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Desmarcar Todos
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">{selectedUsers.length}</span> usuários selecionados
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    selectedUsers.includes(user.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleUser(user.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedUsers.includes(user.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedUsers.includes(user.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{user.nome}</h3>
                          {user.tipo_usuario === 'admin' && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              Admin
                            </span>
                          )}
                          {!user.ativo && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              Inativo
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Último Acesso:</div>
                      <div className="font-medium">{formatLastLogin(user.ultimo_acesso)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedUsers.length > 0 && (
                <span>
                  <span className="font-semibold text-blue-600">{selectedUsers.length}</span> usuários selecionados
                  {selectedUsers.length > 0 && (
                    <span className="ml-2 text-gray-500">
                      • Economizará {stats.total - selectedUsers.length} notificações desnecessárias
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedUsers.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Notificar Selecionados ({selectedUsers.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTargetSelector;
