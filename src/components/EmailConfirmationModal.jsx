import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { X, Mail, CheckCircle, ExternalLink } from 'lucide-react';

const EmailConfirmationModal = ({ isOpen, onClose, userData }) => {
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
            Usuário Criado com Sucesso!
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 text-center space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center mb-3">
              <Mail className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              📧 Email de Boas-vindas Enviado!
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Um email com as credenciais de acesso e instruções foi enviado para:
            </p>
            <div className="bg-white border rounded-md p-3">
              <p className="font-mono text-sm font-medium text-blue-700">
                {userData.email}
              </p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">
              📋 O que o usuário recebeu:
            </h4>
            <ul className="text-sm text-amber-700 space-y-1 text-left">
              <li>✅ Email e senha de acesso</li>
              <li>✅ Link direto para o sistema</li>
              <li>✅ Instruções de primeiro login</li>
              <li>✅ Orientações de segurança</li>
            </ul>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">
              🔒 Próximos Passos:
            </h4>
            <ul className="text-sm text-red-700 space-y-1 text-left">
              <li>• O usuário receberá o email em alguns minutos</li>
              <li>• No primeiro login, será obrigatório alterar a senha</li>
              <li>• Oriente o usuário a verificar a caixa de spam</li>
            </ul>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 mb-3">
              💡 <strong>Dica:</strong> O usuário <strong>{userData.nome}</strong> pode entrar em contato
              se não receber o email em alguns minutos.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <ExternalLink className="h-4 w-4" />
              <span>O email contém um botão direto para acessar o sistema</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailConfirmationModal;
