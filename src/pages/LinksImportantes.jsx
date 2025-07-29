import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ExternalLink, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown,
  Globe,
  Headphones,
  Book,
  Clipboard,
  MessageCircle,
  Link as LinkIcon,
  Settings,
  Phone,
  Mail,
  FileText,
  Download,
  Search,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getLinksAtivos, 
  getTodosLinks, 
  criarLink, 
  atualizarLink, 
  excluirLink, 
  toggleAtivoLink,
  reordenarLinks,
  getProximaOrdem 
} from '../services/linksService';

const iconesDisponiveis = {
  'globe': Globe,
  'headphones': Headphones,
  'book': Book,
  'clipboard': Clipboard,
  'message-circle': MessageCircle,
  'link': LinkIcon,
  'settings': Settings,
  'phone': Phone,
  'mail': Mail,
  'file-text': FileText,
  'download': Download,
  'search': Search,
  'users': Users,
  'shield': Shield,
  'zap': Zap
};

const coresDisponiveis = [
  { value: 'red', label: 'Vermelho', class: 'bg-red-500 hover:bg-red-600' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-500 hover:bg-blue-600' },
  { value: 'green', label: 'Verde', class: 'bg-green-500 hover:bg-green-600' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-500 hover:bg-purple-600' },
  { value: 'orange', label: 'Laranja', class: 'bg-orange-500 hover:bg-orange-600' },
  { value: 'teal', label: 'Azul-verde', class: 'bg-teal-500 hover:bg-teal-600' },
  { value: 'pink', label: 'Rosa', class: 'bg-pink-500 hover:bg-pink-600' },
  { value: 'indigo', label: 'Índigo', class: 'bg-indigo-500 hover:bg-indigo-600' }
];

export default function LinksImportantes() {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [linkEditando, setLinkEditando] = useState(null);
  const [filtroNome, setFiltroNome] = useState('');
  const [formData, setFormData] = useState({
    titulo: '',
    url: '',
    descricao: '',
    icone: 'link',
    cor: 'blue'
  });

  useEffect(() => {
    carregarLinks();
  }, [user]);

  const carregarLinks = async () => {
    setLoading(true);
    try {
      const resultado = user ? await getTodosLinks() : await getLinksAtivos();
      if (resultado.success) {
        setLinks(resultado.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar links:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (link = null) => {
    if (link) {
      setLinkEditando(link);
      setFormData({
        titulo: link.titulo,
        url: link.url,
        descricao: link.descricao || '',
        icone: link.icone || 'link',
        cor: link.cor || 'blue'
      });
    } else {
      setLinkEditando(null);
      setFormData({
        titulo: '',
        url: '',
        descricao: '',
        icone: 'link',
        cor: 'blue'
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setLinkEditando(null);
    setFormData({
      titulo: '',
      url: '',
      descricao: '',
      icone: 'link',
      cor: 'blue'
    });
  };

  const salvarLink = async () => {
    if (!formData.titulo || !formData.url) {
      alert('Título e URL são obrigatórios!');
      return;
    }

    try {
      let resultado;
      if (linkEditando) {
        resultado = await atualizarLink(linkEditando.id, formData);
      } else {
        const proximaOrdem = await getProximaOrdem();
        resultado = await criarLink({
          ...formData,
          ordem: proximaOrdem.success ? proximaOrdem.data : 1
        });
      }

      if (resultado.success) {
        await carregarLinks();
        fecharModal();
      } else {
        alert('Erro ao salvar link: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro ao salvar link:', error);
      alert('Erro ao salvar link!');
    }
  };

  const removerLink = async (id) => {
    if (!confirm('Tem certeza que deseja remover este link?')) return;

    try {
      const resultado = await excluirLink(id);
      if (resultado.success) {
        await carregarLinks();
      } else {
        alert('Erro ao remover link: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro ao remover link:', error);
      alert('Erro ao remover link!');
    }
  };

  const toggleAtivo = async (id, ativo) => {
    try {
      const resultado = await toggleAtivoLink(id, !ativo);
      if (resultado.success) {
        await carregarLinks();
      } else {
        alert('Erro ao alterar status: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status!');
    }
  };

  const moverLink = async (index, direcao) => {
    const novosLinks = [...links];
    const novoIndex = direcao === 'up' ? index - 1 : index + 1;
    
    if (novoIndex < 0 || novoIndex >= novosLinks.length) return;

    [novosLinks[index], novosLinks[novoIndex]] = [novosLinks[novoIndex], novosLinks[index]];
    
    try {
      const resultado = await reordenarLinks(novosLinks);
      if (resultado.success) {
        setLinks(novosLinks);
      }
    } catch (error) {
      console.error('Erro ao reordenar links:', error);
    }
  };

  const abrirLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getCorClass = (cor) => {
    const corObj = coresDisponiveis.find(c => c.value === cor);
    return corObj ? corObj.class : 'bg-blue-500 hover:bg-blue-600';
  };

  const getIcone = (nomeIcone) => {
    const IconeComponent = iconesDisponiveis[nomeIcone] || LinkIcon;
    return <IconeComponent className="h-6 w-6" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando links...</p>
        </div>
      </div>
    );
  }

  return (
    
    
    <div className="container mx-auto px-4 py-8">
       <div className="mb-4">
        <Input
          type="text"
          placeholder="Pesquisar por nome..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
        />
      </div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Links Importantes</h1>
          <p className="text-gray-600 mt-2">
            Acesso rápido aos principais recursos e ferramentas
          </p>
        </div>
        {user && (
          <Button onClick={() => abrirModal()} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Link
          </Button>
        )}
      </div>

      {/* Grid de Links */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {links
    .filter(link => link.nome.toLowerCase().includes(filtroNome.toLowerCase()))
    .map((link, index) => (
      <Card 
        key={link.id} 
        className={`relative transition-all duration-200 hover:shadow-lg ${
          !link.ativo && user ? 'opacity-50' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg text-white ${getCorClass(link.cor)}`}>
                {getIcone(link.icone)}
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{link.titulo}</CardTitle>
                {link.descricao && (
                  <CardDescription className="mt-1">
                    {link.descricao}
                  </CardDescription>
                )}
              </div>
            </div>
            {!link.ativo && user && (
              <Badge variant="secondary" className="text-xs">
                Inativo
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => abrirLink(link.url)}
              variant="outline"
              size="sm"
              className="flex-1 mr-2"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Acessar
            </Button>

            {user && (
              <div className="flex space-x-1">
                <Button
                  onClick={() => abrirModal(link)}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => toggleAtivo(link.id, link.ativo)}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                >
                  {link.ativo ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => removerLink(link.id)}
                  variant="ghost"
                  size="sm"
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {index > 0 && (
                  <Button
                    onClick={() => moverLink(index, 'up')}
                    variant="ghost"
                    size="sm"
                    className="p-2"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                )}
                {index < links.length - 1 && (
                  <Button
                    onClick={() => moverLink(index, 'down')}
                    variant="ghost"
                    size="sm"
                    className="p-2"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    ))}
</div>

      {links.length === 0 && (
        <div className="text-center py-12">
          <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum link encontrado
          </h3>
          <p className="text-gray-600">
            {user ? 'Clique em "Novo Link" para adicionar o primeiro link.' : 'Não há links disponíveis no momento.'}
          </p>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {linkEditando ? 'Editar Link' : 'Novo Link'}
            </DialogTitle>
            <DialogDescription>
              {linkEditando ? 'Edite as informações do link.' : 'Adicione um novo link importante.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                placeholder="Ex: Portal Desktop Fibra"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="https://exemplo.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Breve descrição do link..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="icone">Ícone</Label>
                <Select value={formData.icone} onValueChange={(value) => setFormData({...formData, icone: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(iconesDisponiveis).map(([key, IconeComponent]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          <IconeComponent className="h-4 w-4" />
                          <span className="capitalize">{key.replace('-', ' ')}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="cor">Cor</Label>
                <Select value={formData.cor} onValueChange={(value) => setFormData({...formData, cor: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {coresDisponiveis.map((cor) => (
                      <SelectItem key={cor.value} value={cor.value}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded ${cor.class}`}></div>
                          <span>{cor.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={fecharModal}>
              Cancelar
            </Button>
            <Button onClick={salvarLink} className="bg-red-600 hover:bg-red-700">
              {linkEditando ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

