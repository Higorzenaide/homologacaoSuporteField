import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { X, CheckCircle, User, Shield } from 'lucide-react';

const UserCreatedModal = ({ isOpen, onClose, userData }) => {
  if (!userData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-8 w-8 p-0 hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-center pr-8">
            <div className="flex items-center justify-center mb-3">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            Usuário Criado com Sucesso! 🎉
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 text-center space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center mb-3">
              <User className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              🎉 Bem-vindo(a) ao Suporte Field!
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              O usuário foi cadastrado com sucesso no sistema:
            </p>
            <div className="bg-white border rounded-md p-3">
              <p className="font-mono text-sm font-medium text-blue-700">
                {userData.email}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Nome: {userData.nome}
              </p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">
              📋 Dados do Usuário:
            </h4>
            <ul className="text-sm text-amber-700 space-y-1 text-left">
              <li>✅ Cadastro realizado com sucesso</li>
              <li>✅ Acesso ao sistema liberado</li>
              <li>✅ Perfil configurado</li>
              <li>✅ Pronto para uso</li>
            </ul>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">
              🚀 Próximos Passos:
            </h4>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>• O usuário pode fazer login no sistema</li>
              <li>• Explore as funcionalidades disponíveis</li>
              <li>• Configure preferências se necessário</li>
              <li>• Entre em contato se precisar de ajuda</li>
            </ul>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 mb-3">
              💡 <strong>Dica:</strong> O usuário <strong>{userData.nome}</strong> já pode acessar
              o sistema com as credenciais fornecidas.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <Shield className="h-4 w-4" />
              <span>Sistema seguro e pronto para uso</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserCreatedModal;
