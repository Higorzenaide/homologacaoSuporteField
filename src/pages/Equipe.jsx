import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Target, 
  Phone, 
  Mail, 
  MessageCircle, 
  BookOpen, 
  Award, 
  TrendingUp,
  Shield,
  Wrench,
  HeadphonesIcon,
  Clock
} from 'lucide-react';
import { equipe } from '../data/mockData';

const Equipe = () => {
  const servicos = [
    {
      icon: HeadphonesIcon,
      titulo: 'Suporte Técnico',
      descricao: 'Atendimento especializado para resolução de problemas em campo',
      cor: 'text-blue-600'
    },
    {
      icon: BookOpen,
      titulo: 'Treinamentos',
      descricao: 'Capacitação contínua com materiais atualizados e práticos',
      cor: 'text-green-600'
    },
    {
      icon: Wrench,
      titulo: 'Recursos Técnicos',
      descricao: 'Ferramentas e equipamentos para otimizar o trabalho em campo',
      cor: 'text-purple-600'
    },
    {
      icon: Shield,
      titulo: 'Protocolos de Segurança',
      descricao: 'Normas e procedimentos para garantir segurança no trabalho',
      cor: 'text-red-600'
    }
  ];

  const estatisticas = [
    {
      icon: BookOpen,
      titulo: 'Treinamentos',
      valor: equipe.estatisticas.treinamentos,
      descricao: 'Materiais disponíveis',
      cor: 'text-blue-600'
    },
    {
      icon: Users,
      titulo: 'Técnicos Atendidos',
      valor: equipe.estatisticas.tecnicos,
      descricao: 'Profissionais apoiados',
      cor: 'text-green-600'
    },
    {
      icon: Award,
      titulo: 'Satisfação',
      valor: equipe.estatisticas.satisfacao,
      descricao: 'Índice de qualidade',
      cor: 'text-[var(--desktop-red)]'
    },
    {
      icon: TrendingUp,
      titulo: 'Categorias',
      valor: equipe.estatisticas.categorias,
      descricao: 'Áreas de conhecimento',
      cor: 'text-purple-600'
    }
  ];

  const horarios = [
    { dia: 'Segunda a Sexta', horario: '08:00 - 18:00' },
    { dia: 'Sábados', horario: '08:00 - 12:00' },
    { dia: 'Domingos e Feriados', horario: 'Plantão de emergência' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mx-auto w-20 h-20 bg-[var(--desktop-red)] rounded-full flex items-center justify-center mb-6">
            <Users className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {equipe.nome}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {equipe.descricao}
          </p>
        </div>

        {/* Missão */}
        <Card className="mb-12 border-[var(--desktop-red)] border-t-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-[var(--desktop-yellow)] rounded-full flex items-center justify-center mb-4">
              <Target className="text-black" size={24} />
            </div>
            <CardTitle className="text-2xl text-gray-900">Nossa Missão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-gray-700 text-center leading-relaxed">
              {equipe.missao}
            </p>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Nossos Resultados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {estatisticas.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Icon className={stat.cor} size={24} />
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900">
                      {stat.valor}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-lg font-medium text-gray-700">
                      {stat.titulo}
                    </CardDescription>
                    <p className="text-sm text-gray-500 mt-1">
                      {stat.descricao}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Serviços */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Como Apoiamos Você
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {servicos.map((servico, index) => {
              const Icon = servico.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Icon className={servico.cor} size={24} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{servico.titulo}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{servico.descricao}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Contato e Horários */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Contato */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Phone className="mr-3 text-[var(--desktop-red)]" size={24} />
                Entre em Contato
              </CardTitle>
              <CardDescription>
                Estamos sempre disponíveis para ajudar você
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="text-[var(--desktop-red)]" size={20} />
                <div>
                  <p className="font-medium">Telefone</p>
                  <p className="text-gray-600">{equipe.contato.telefone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MessageCircle className="text-green-600" size={20} />
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-gray-600">{equipe.contato.whatsapp}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="text-blue-600" size={20} />
                <div>
                  <p className="font-medium">E-mail</p>
                  <p className="text-gray-600">{equipe.contato.email}</p>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button 
                  className="w-full bg-[var(--desktop-red)] hover:bg-[var(--desktop-red-dark)] text-white"
                  onClick={() => window.open(`tel:${equipe.contato.telefone}`, '_blank')}
                >
                  <Phone className="mr-2" size={16} />
                  Ligar Agora
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() => window.open(`https://wa.me/55${equipe.contato.whatsapp.replace(/\D/g, '')}`, '_blank')}
                >
                  <MessageCircle className="mr-2" size={16} />
                  WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Horários */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Clock className="mr-3 text-[var(--desktop-red)]" size={24} />
                Horários de Atendimento
              </CardTitle>
              <CardDescription>
                Quando você pode contar conosco
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {horarios.map((horario, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{horario.dia}</span>
                  <Badge variant="outline" className="text-[var(--desktop-red)] border-[var(--desktop-red)]">
                    {horario.horario}
                  </Badge>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-[var(--desktop-red)] bg-opacity-10 rounded-lg border border-[var(--desktop-red)] border-opacity-20">
                <p className="text-sm text-[var(--desktop-red)] font-medium text-center">
                  💡 Para emergências fora do horário comercial, utilize o WhatsApp
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-[var(--desktop-red)] to-red-700 text-white">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">
              Precisa de Apoio?
            </h2>
            <p className="text-xl mb-8 text-red-100">
              Nossa equipe está pronta para ajudar você a ter sucesso no campo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-[var(--desktop-yellow)] text-black hover:bg-yellow-500 font-semibold"
                onClick={() => window.open(`https://wa.me/55${equipe.contato.whatsapp.replace(/\D/g, '')}`, '_blank')}
              >
                <MessageCircle className="mr-2" size={20} />
                Falar no WhatsApp
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-[var(--desktop-red)]"
                onClick={() => window.open(`mailto:${equipe.contato.email}`, '_blank')}
              >
                <Mail className="mr-2" size={20} />
                Enviar E-mail
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Equipe;

