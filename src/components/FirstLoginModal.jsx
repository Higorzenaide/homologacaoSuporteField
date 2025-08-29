import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Lock, Shield, Key, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import firstLoginService from '../services/firstLoginService';

const FirstLoginModal = ({ isOpen, onPasswordChanged, userEmail }) => {
  const { user } = useAuth();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validarSenha = (senha) => {
    return firstLoginService.validatePassword(senha);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validações
      if (!novaSenha || !confirmarSenha) {
        setError('Por favor, preencha todos os campos');
        return;
      }

      if (novaSenha !== confirmarSenha) {
        setError('As senhas não coincidem');
        return;
      }

      const { valida } = validarSenha(novaSenha);
      if (!valida) {
        setError('A senha não atende aos critérios de segurança');
        return;
      }

      if (!user?.id) {
        setError('Usuário não identificado');
        return;
      }

      // Alterar senha usando o serviço personalizado
      const result = await firstLoginService.changePassword(user.id, novaSenha);

      if (result.success) {
        console.log('✅ Senha alterada com sucesso!');
        // Sucesso - chamar callback
        onPasswordChanged();
      } else {
        throw new Error(result.error || 'Erro ao alterar senha');
      }
      
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      setError(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const { valida, criterios } = validarSenha(novaSenha);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            🔐 Primeiro Login - Alterar Senha
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Key className="h-5 w-5 text-amber-600 mr-2" />
              <h3 className="font-semibold text-amber-800">Segurança Obrigatória</h3>
            </div>
            <p className="text-sm text-amber-700">
              Por motivos de segurança, você deve alterar sua senha temporária antes de continuar usando o sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="nova-senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmar-senha"
                  type={mostrarConfirmarSenha ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Critérios de Senha */}
            {novaSenha && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Critérios de Segurança:</h4>
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center ${criterios.tamanho ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${criterios.tamanho ? 'text-green-500' : 'text-gray-400'}`} />
                    Mínimo de 6 caracteres
                  </div>
                  <div className={`flex items-center ${criterios.maiuscula ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${criterios.maiuscula ? 'text-green-500' : 'text-gray-400'}`} />
                    Pelo menos uma letra maiúscula
                  </div>
                  <div className={`flex items-center ${criterios.numero ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${criterios.numero ? 'text-green-500' : 'text-gray-400'}`} />
                    Pelo menos um número
                  </div>
                  <div className={`flex items-center ${criterios.especial ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${criterios.especial ? 'text-green-500' : 'text-gray-400'}`} />
                    Pelo menos um caractere especial (!@#$%^&*)
                  </div>
                </div>
              </div>
            )}

            {/* Validação de senhas iguais */}
            {confirmarSenha && novaSenha !== confirmarSenha && (
              <Alert variant="destructive">
                <AlertDescription>
                  As senhas não coincidem
                </AlertDescription>
              </Alert>
            )}

            {/* Erro */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Botão de submit */}
            <Button
              type="submit"
              disabled={loading || !valida || novaSenha !== confirmarSenha}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando Senha...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Alterar Senha e Continuar
                </>
              )}
            </Button>
          </form>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">
              ✅ Após alterar sua senha:
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Você terá acesso completo ao sistema</li>
              <li>• Esta etapa não será mais solicitada</li>
              <li>• Suas informações estarão seguras</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirstLoginModal;
