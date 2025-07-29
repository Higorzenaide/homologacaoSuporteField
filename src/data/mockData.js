// Dados mockados para o portfólio da equipe Suporte Field

export const treinamentos = [
  {
    id: "1",
    titulo: "Procedimentos de Instalação Fibra Óptica",
    categoria: "Procedimentos Técnicos",
    arquivo: "/treinamentos/instalacao-fibra.pdf",
    tipo: "PDF",
    dataUpload: "2024-01-15",
    descricao: "Guia completo para instalação de fibra óptica em residências e empresas",
    tags: ["fibra", "instalação", "técnico"],
    thumbnail: "/thumbnails/instalacao-fibra.jpg"
  },
  {
    id: "2",
    titulo: "Segurança no Trabalho em Campo",
    categoria: "Segurança no Trabalho",
    arquivo: "/treinamentos/seguranca-campo.ppt",
    tipo: "PPT",
    dataUpload: "2024-01-20",
    descricao: "Normas de segurança para técnicos que trabalham em campo",
    tags: ["segurança", "campo", "normas"],
    thumbnail: "/thumbnails/seguranca-campo.jpg"
  },
  {
    id: "3",
    titulo: "Atendimento ao Cliente - Boas Práticas",
    categoria: "Atendimento ao Cliente",
    arquivo: "/treinamentos/atendimento-cliente.pdf",
    tipo: "PDF",
    dataUpload: "2024-01-25",
    descricao: "Como oferecer um atendimento de excelência aos clientes Desktop",
    tags: ["atendimento", "cliente", "comunicação"],
    thumbnail: "/thumbnails/atendimento-cliente.jpg"
  },
  {
    id: "4",
    titulo: "Equipamentos de Medição e Teste",
    categoria: "Equipamentos e Ferramentas",
    arquivo: "/treinamentos/equipamentos-medicao.ppt",
    tipo: "PPT",
    dataUpload: "2024-02-01",
    descricao: "Uso correto dos equipamentos de medição para fibra óptica",
    tags: ["equipamentos", "medição", "teste"],
    thumbnail: "/thumbnails/equipamentos-medicao.jpg"
  },
  {
    id: "5",
    titulo: "Protocolos de Manutenção Preventiva",
    categoria: "Manutenção Preventiva",
    arquivo: "/treinamentos/manutencao-preventiva.pdf",
    tipo: "PDF",
    dataUpload: "2024-02-05",
    descricao: "Rotinas de manutenção para evitar problemas na rede",
    tags: ["manutenção", "preventiva", "rede"],
    thumbnail: "/thumbnails/manutencao-preventiva.jpg"
  },
  {
    id: "6",
    titulo: "Troubleshooting de Conexões",
    categoria: "Procedimentos Técnicos",
    arquivo: "/treinamentos/troubleshooting.pdf",
    tipo: "PDF",
    dataUpload: "2024-02-10",
    descricao: "Diagnóstico e solução de problemas de conectividade",
    tags: ["troubleshooting", "conexão", "diagnóstico"],
    thumbnail: "/thumbnails/troubleshooting.jpg"
  },
  {
    id: "7",
    titulo: "Uso de EPIs em Instalações",
    categoria: "Segurança no Trabalho",
    arquivo: "/treinamentos/epis-instalacao.ppt",
    tipo: "PPT",
    dataUpload: "2024-02-15",
    descricao: "Equipamentos de proteção individual obrigatórios",
    tags: ["epi", "segurança", "proteção"],
    thumbnail: "/thumbnails/epis-instalacao.jpg"
  },
  {
    id: "8",
    titulo: "Configuração de Roteadores",
    categoria: "Equipamentos e Ferramentas",
    arquivo: "/treinamentos/config-roteadores.pdf",
    tipo: "PDF",
    dataUpload: "2024-02-20",
    descricao: "Configuração básica e avançada de roteadores Desktop",
    tags: ["roteador", "configuração", "wifi"],
    thumbnail: "/thumbnails/config-roteadores.jpg"
  }
];

export const noticias = [
  {
    id: "1",
    titulo: "Nova Ferramenta de Diagnóstico Disponível",
    conteudo: "A partir desta semana, todos os técnicos terão acesso à nova ferramenta de diagnóstico automático que reduz o tempo de identificação de problemas em 50%. A ferramenta está disponível no tablet de campo e será demonstrada no treinamento de quinta-feira.",
    dataPublicacao: "2024-02-28",
    categoria: "Ferramentas",
    autor: "Coordenação Técnica",
    destaque: true
  },
  {
    id: "2",
    titulo: "Atualização nos Protocolos de Segurança",
    conteudo: "Foram atualizados os protocolos de segurança para trabalho em altura. Todos os técnicos devem revisar o documento atualizado disponível na seção de treinamentos. As mudanças entram em vigor na próxima segunda-feira.",
    dataPublicacao: "2024-02-27",
    categoria: "Segurança",
    autor: "Departamento de Segurança",
    destaque: true
  },
  {
    id: "3",
    titulo: "Novos Equipamentos Chegaram",
    conteudo: "Recebemos os novos medidores de potência óptica modelo XYZ-2024. Os equipamentos estão sendo distribuídos por região. Verifique com seu supervisor a disponibilidade para sua área.",
    dataPublicacao: "2024-02-26",
    categoria: "Equipamentos",
    autor: "Logística",
    destaque: false
  },
  {
    id: "4",
    titulo: "Treinamento Obrigatório - Março",
    conteudo: "Será realizado treinamento obrigatório sobre as novas normas da ANATEL no dia 15 de março. Todos os técnicos devem confirmar presença até o dia 10. Local: Auditório da sede central.",
    dataPublicacao: "2024-02-25",
    categoria: "Treinamento",
    autor: "RH",
    destaque: false
  },
  {
    id: "5",
    titulo: "Metas de Qualidade Alcançadas",
    conteudo: "Parabéns equipe! Alcançamos 98% de satisfação dos clientes no mês de fevereiro, superando nossa meta de 95%. Continue com o excelente trabalho!",
    dataPublicacao: "2024-02-24",
    categoria: "Resultados",
    autor: "Gerência",
    destaque: false
  }
];

export const categorias = [
  "Todas",
  "Procedimentos Técnicos",
  "Segurança no Trabalho",
  "Atendimento ao Cliente",
  "Equipamentos e Ferramentas",
  "Manutenção Preventiva"
];

export const categoriasNoticias = [
  "Todas",
  "Ferramentas",
  "Segurança",
  "Equipamentos",
  "Treinamento",
  "Resultados"
];

export const equipe = {
  nome: "Suporte Field",
  descricao: "Equipe especializada em apoio ao técnico de campo, fornecendo suporte, treinamentos e recursos necessários para garantir a excelência no atendimento e instalação dos serviços Desktop Fibra Internet.",
  missao: "Capacitar e apoiar os técnicos de campo com conhecimento, ferramentas e procedimentos atualizados para entregar a melhor experiência aos nossos clientes.",
  contato: {
    email: "suporte.field@desktop.com.br",
    telefone: "(19) 2660-2127",
    whatsapp: "(19) 99830-3838"
  },
  estatisticas: {
    treinamentos: treinamentos.length,
    categorias: categorias.length - 1, // Excluindo "Todas"
    tecnicos: 45,
    satisfacao: "98%"
  }
};

