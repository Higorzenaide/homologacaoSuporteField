import { supabase } from '../lib/supabase';
import emailService from './emailService';
import securityService from './securityService';

// Serviço para gerenciamento de usuários
export const usuariosService = {
  // Listar todos os usuários
  async listarUsuarios() {
    try {
      const { data, error } = await supabase
        .from('vw_usuarios_safe') // View sem campo senha
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return { data: null, error: error.message };
    }
  },

  // Criar novo usuário
  async criarUsuario(dadosUsuario) {
    try {
      // Validação de segurança completa
      const validation = securityService.validateUserData(dadosUsuario, false);
      if (!validation.valid) {
        return { data: null, error: validation.errors.join(', ') };
      }

      // Usar dados sanitizados
      const sanitizedData = validation.sanitizedData;

      // Log da tentativa de criação
      securityService.logSecurityEvent('USER_CREATE_ATTEMPT', null, { 
        email: sanitizedData.email,
        tipo: sanitizedData.tipo_usuario 
      });

      const { data, error } = await supabase
        .rpc('create_user_secure', {
          user_email: sanitizedData.email,
          user_password: sanitizedData.senha,
          user_nome: sanitizedData.nome,
          user_cargo: sanitizedData.cargo || null,
          user_telefone: sanitizedData.telefone || null,
          user_tipo: sanitizedData.tipo_usuario || 'usuario'
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        
        // Se o usuário foi criado com sucesso, configurar dados iniciais
        if (result.success) {
          console.log('👤 Usuário criado com sucesso, configurando dados iniciais...');
          
          const userData = {
            email: dadosUsuario.email,
            nome: dadosUsuario.nome,
            senha: dadosUsuario.senha,
            tipo_usuario: dadosUsuario.tipo_usuario || 'usuario',
            cargo: dadosUsuario.cargo || null
          };

          // Criar configurações de notificação para o novo usuário
          // await this.criarConfiguracaoNotificacao(result.id);
          console.log('🔔 Configurações de notificação desabilitadas temporariamente');

          // Enviar email de boas-vindas de forma assíncrona (não bloquear a criação do usuário)
          this.enviarEmailBoasVindas(userData);
        }
        
        return {
          data: result,
          error: result.success ? null : result.message
        };
      }

      return { data: null, error: 'Erro desconhecido ao criar usuário' };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return { data: null, error: error.message };
    }
  },

  // Enviar email de boas-vindas (método auxiliar)
  async enviarEmailBoasVindas(userData) {
    try {
      console.log(`📧 Enviando email de boas-vindas para ${userData.email}...`);
      
      const resultado = await emailService.sendWelcomeEmail(userData);
      
      if (resultado.success) {
        console.log(`✅ Email de boas-vindas enviado com sucesso para ${userData.email}`);
      } else {
        console.warn(`⚠️ Falha ao enviar email de boas-vindas para ${userData.email}:`, resultado.error);
      }
    } catch (error) {
      console.error(`❌ Erro ao enviar email de boas-vindas para ${userData.email}:`, error);
    }
  },

  // Atualizar usuário existente
  async atualizarUsuario(id, dadosUsuario) {
    try {
      const updateData = {
        nome: dadosUsuario.nome,
        cargo: dadosUsuario.cargo,
        telefone: dadosUsuario.telefone,
        tipo_usuario: dadosUsuario.tipo_usuario,
        ativo: dadosUsuario.ativo,
        updated_at: new Date().toISOString()
      };

      // Se senha foi fornecida, incluir na atualização
      if (dadosUsuario.senha && dadosUsuario.senha.trim() !== '') {
        updateData.senha = dadosUsuario.senha;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', id)
        .select('id, email, nome, cargo, telefone, tipo_usuario, ativo, created_at, updated_at')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { data: null, error: error.message };
    }
  },

  // Desativar usuário (soft delete)
  async desativarUsuario(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ 
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, email, nome, ativo')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      return { data: null, error: error.message };
    }
  },

  // Reativar usuário
  async reativarUsuario(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ 
          ativo: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, email, nome, ativo')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao reativar usuário:', error);
      return { data: null, error: error.message };
    }
  },

  // Alterar senha de usuário específico
  async alterarSenhaUsuario(id, novaSenha) {
    try {
      const { data, error } = await supabase
        .rpc('update_user_password', {
          user_id: id,
          new_password: novaSenha
        });

      if (error) throw error;
      return { 
        data: { success: data }, 
        error: data ? null : 'Erro ao alterar senha' 
      };
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return { data: null, error: error.message };
    }
  },

  // Obter estatísticas de usuários
  async obterEstatisticas() {
    try {
      const { data, error } = await supabase
        .from('vw_usuarios_stats')
        .select('*')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { data: null, error: error.message };
    }
  },

  // Buscar usuário por email
  async buscarPorEmail(email) {
    try {
      const { data, error } = await supabase
        .from('vw_usuarios_safe')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return { data: null, error: error.message };
    }
  },

  // Obter usuário por ID
  async obterPorId(id) {
    try {
      const { data, error } = await supabase
        .from('vw_usuarios_safe')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao obter usuário por ID:', error);
      return { data: null, error: error.message };
    }
  },

  // Validar dados de usuário
  validarDados(dadosUsuario, isEdicao = false) {
    const erros = [];

    // Validar email
    if (!dadosUsuario.email || !dadosUsuario.email.trim()) {
      erros.push('Email é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dadosUsuario.email)) {
      erros.push('Email deve ter um formato válido');
    }

    // Validar nome
    if (!dadosUsuario.nome || !dadosUsuario.nome.trim()) {
      erros.push('Nome é obrigatório');
    } else if (dadosUsuario.nome.trim().length < 2) {
      erros.push('Nome deve ter pelo menos 2 caracteres');
    }

    // Validar senha (apenas para criação ou se fornecida na edição)
    if (!isEdicao || (dadosUsuario.senha && dadosUsuario.senha.trim() !== '')) {
      if (!dadosUsuario.senha || dadosUsuario.senha.length < 6) {
        erros.push('Senha deve ter pelo menos 6 caracteres');
      }
    }

    // Validar tipo de usuário
    if (!dadosUsuario.tipo_usuario || !['admin', 'usuario'].includes(dadosUsuario.tipo_usuario)) {
      erros.push('Tipo de usuário deve ser "admin" ou "usuario"');
    }

    // Validar telefone (se fornecido)
    if (dadosUsuario.telefone && dadosUsuario.telefone.trim() !== '') {
      const telefone = dadosUsuario.telefone.replace(/\D/g, '');
      if (telefone.length < 10 || telefone.length > 11) {
        erros.push('Telefone deve ter 10 ou 11 dígitos');
      }
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  // Formatar dados para exibição
  formatarParaExibicao(usuario) {
    return {
      ...usuario,
      tipo_usuario_label: usuario.tipo_usuario === 'admin' ? 'Administrador' : 'Usuário',
      ativo_label: usuario.ativo ? 'Ativo' : 'Inativo',
      created_at_formatted: new Date(usuario.created_at).toLocaleDateString('pt-BR'),
      updated_at_formatted: usuario.updated_at ? new Date(usuario.updated_at).toLocaleDateString('pt-BR') : '-',
      ultimo_acesso_formatted: usuario.ultimo_acesso ? new Date(usuario.ultimo_acesso).toLocaleDateString('pt-BR') : 'Nunca'
    };
  },

  // Gerar senha temporária
  gerarSenhaTemporaria() {
    const maiusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const especiais = '!@#$%^&*';
    
    // Garantir que a senha tenha pelo menos um de cada tipo
    let senha = '';
    senha += maiusculas.charAt(Math.floor(Math.random() * maiusculas.length));
    senha += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
    senha += numeros.charAt(Math.floor(Math.random() * numeros.length));
    senha += especiais.charAt(Math.floor(Math.random() * especiais.length));
    
    // Completar até 10 caracteres com caracteres aleatórios
    const todosChars = maiusculas + minusculas + numeros + especiais;
    for (let i = senha.length; i < 10; i++) {
      senha += todosChars.charAt(Math.floor(Math.random() * todosChars.length));
    }
    
    // Embaralhar a senha para não ter padrão previsível
    return senha.split('').sort(() => Math.random() - 0.5).join('');
  },

  // Excluir usuário permanentemente
  async excluirUsuario(usuarioId) {
    try {
      // Validações de segurança
      if (!securityService.isValidUUID(usuarioId)) {
        return { data: null, error: 'ID de usuário inválido' };
      }

      // Log da tentativa de exclusão
      securityService.logSecurityEvent('USER_DELETE_ATTEMPT', null, { 
        userId: usuarioId
      });

      console.log('🗑️ Tentando excluir usuário via função RPC segura...');

      // Tentar usar a função RPC otimizada (CASCADE)
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('excluir_usuario_cascade', {
            p_user_id: usuarioId
          });

        if (rpcError) throw rpcError;

        if (rpcData && rpcData.length > 0) {
          const result = rpcData[0];
          
          if (result.success) {
            console.log('✅ Usuário excluído via CASCADE:', result.message);
            console.log('📊 Tabelas afetadas:', result.deleted_tables);

            // Log de sucesso
            securityService.logSecurityEvent('USER_DELETED_SUCCESS', null, { 
              userId: usuarioId,
              method: 'rpc_cascade',
              affectedTables: result.deleted_tables
            });

            return { data: result, error: null };
          } else {
            throw new Error(result.message);
          }
        }
      } catch (rpcError) {
        console.warn('⚠️ Função RPC não disponível, usando método manual:', rpcError.message);
        
        // Fallback para exclusão manual SIMPLES (CASCADE já configurado)
        console.log('🔄 Excluindo usuário diretamente (CASCADE ativo)...');

        // Com CASCADE ativo, podemos excluir diretamente da tabela usuarios
        const { data, error } = await supabase
          .from('usuarios')
          .delete()
          .eq('id', usuarioId);

        if (error) throw error;

        console.log('✅ Usuário excluído com sucesso (método direto via CASCADE)');

        // Log de sucesso
        securityService.logSecurityEvent('USER_DELETED_SUCCESS', null, { 
          userId: usuarioId,
          method: 'direct_cascade'
        });

        return { data, error: null };
      }
    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      
      // Log de falha
      securityService.logSecurityEvent('USER_DELETE_FAILED', null, { 
        userId: usuarioId,
        error: error.message
      });
      
      return { data: null, error: error.message };
    }
  },

  // Criar configurações de notificação padrão para novo usuário
  async criarConfiguracaoNotificacao(userId) {
    try {
      console.log('🔔 Criando configurações de notificação para usuário:', userId);

      const defaultSettings = {
        user_id: userId,
        email_notifications: true,
        push_notifications: true,
        training_reminders: true,
        system_notifications: true,
        reminder_frequency: 'daily',
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00'
      };

      const { data, error } = await supabase
        .from('notification_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar configurações de notificação:', error);
        // Não bloquear a criação do usuário por erro nas configurações
        return { data: null, error: error.message };
      }

      console.log('✅ Configurações de notificação criadas:', data);
      return { data, error: null };

    } catch (error) {
      console.error('💥 Erro ao criar configurações de notificação:', error);
      // Não bloquear a criação do usuário por erro nas configurações
      return { data: null, error: error.message };
    }
  }
};

export default usuariosService;

