import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import CurtidasButton from "./CurtidasButton";
import EditDeleteActions from "./EditDeleteActions";
import {
  listarComentarios,
  criarComentario,
  contarComentarios,
} from "../services/comentariosService";

const TreinamentoModal = ({
  treinamento,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onViewPDF,
}) => {
  const { user, isAdmin } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);
  const [comentariosCount, setComentariosCount] = useState(0);

  // Carregar comentários quando o modal abrir
  useEffect(() => {
    if (isOpen && treinamento?.id) {
      carregarComentarios();
      carregarContadorComentarios();
    }
  }, [isOpen, treinamento?.id]);

  const carregarComentarios = async () => {
    if (!treinamento?.id) return;

    setCarregandoComentarios(true);
    try {
      const result = await listarComentarios(treinamento.id);
      if (result.success) {
        setComentarios(result.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
    } finally {
      setCarregandoComentarios(false);
    }
  };

  const carregarContadorComentarios = async () => {
    try {
      const result = await contarComentarios(treinamento.id);
      if (result.count !== undefined) {
        setComentariosCount(result.count);
      }
    } catch (error) {
      console.error("Erro ao carregar contador de comentários:", error);
      setComentariosCount(0);
    }
  };

  const handleAdicionarComentario = async () => {
    if (!novoComentario.trim() || !user?.id) return;

    try {
      const result = await criarComentario({
        treinamento_id: treinamento.id,
        usuario_id: user.id,
        comentario: novoComentario.trim(),
      });

      if (result.success) {
        setNovoComentario("");
        await carregarComentarios();
        await carregarContadorComentarios();
      }
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoriaColor = (categoria) => {
    const colors = {
      Equipamentos: "from-blue-500 to-blue-600",
      Ferramentas: "from-green-500 to-green-600",
      Resultados: "from-purple-500 to-purple-600",
      Segurança: "from-red-500 to-red-600",
      Treinamento: "from-orange-500 to-orange-600",
      Outros: "from-indigo-500 to-indigo-600",
      Ticket: "from-cyan-500 to-cyan-600",
      default: "from-gray-700 to-gray-800",
    };
    return colors[categoria] || colors.default;
  };

  if (!treinamento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-white rounded-2xl shadow-2xl">
        {/* Header Corporativo Sofisticado */}
        <div
          className={`relative bg-gradient-to-br ${getCategoriaColor(
            treinamento.categoria
          )} text-white overflow-hidden`}
        >
          {/* Padrões geométricos elaborados */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
            <div className="absolute top-12 right-12 w-24 h-24 bg-white rounded-full opacity-60"></div>
            <div className="absolute top-20 right-20 w-12 h-12 bg-white rounded-full opacity-40"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
            <div className="absolute bottom-8 left-8 w-16 h-16 bg-white rounded-full opacity-50"></div>
            <div className="absolute bottom-16 left-16 w-8 h-8 bg-white rounded-full opacity-30"></div>
          </div>

          {/* Gradiente overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/30"></div>

          <div className="relative z-10 p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                {/* Logo em container maior */}
                <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border-2 border-white/30 shadow-xl">
                  {treinamento.logo_url ? (
                    <img
                      src={treinamento.logo_url}
                      alt="Logo"
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <svg
                      className="w-16 h-16 text-white/90"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                  )}
                </div>

                <div>
                  <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">
                    {treinamento.titulo}
                  </h2>
                  <div className="flex items-center space-x-4 text-white/90">
                    <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/30">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-medium">
                          {formatarData(treinamento.created_at)}
                        </span>
                      </div>
                    </div>

                    {treinamento.arquivo_tamanho && (
                      <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/30">
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="font-medium">
                            {(treinamento.arquivo_tamanho / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/30">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span className="font-medium">
                          {treinamento.visualizacoes || 0} visualizações
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações do admin */}
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <EditDeleteActions
                    item={treinamento}
                    type="treinamento"
                    onEdit={() => onEdit(treinamento)}
                    onDelete={() => onDelete(treinamento)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs melhoradas */}
        <Tabs defaultValue="detalhes" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-gray-50 mx-6 mt-6 rounded-xl p-1">
            <TabsTrigger
              value="detalhes"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="font-semibold">Detalhes</span>
            </TabsTrigger>
            <TabsTrigger
              value="comentarios"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="font-semibold">Comentários</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs">
                {comentariosCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="detalhes" className="p-6 space-y-6">
              {/* Seção Descrição */}
              {treinamento.descricao && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Descrição</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-base">
                    {treinamento.descricao}
                  </p>
                </div>
              )}

              {/* Seção Tags */}
              {(() => {
                const tags = Array.isArray(treinamento.tags)
                  ? treinamento.tags
                  : typeof treinamento.tags === "string"
                  ? treinamento.tags.split(",").map((tag) => tag.trim())
                  : [];

                return (
                  tags.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Tags</h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {tags.map((tag, index) => {
                          const colors = [
                            "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
                            "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
                            "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
                            "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
                            "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200",
                            "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200",
                          ];
                          const colorClass = colors[index % colors.length];

                          return (
                            <Badge
                              key={index}
                              className={`px-4 py-2 text-sm font-semibold border-2 rounded-xl transition-all duration-200 hover:scale-105 ${colorClass}`}
                            >
                              #{tag}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )
                );
              })()}

              {/* Seção Estatísticas - APENAS VISUALIZAÇÕES */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Estatísticas</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Card de Visualizações */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold mb-2">
                          {treinamento.visualizacoes || 0}
                        </div>
                        <div className="text-blue-100 font-medium">Visualizações</div>
                      </div>
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comentarios" className="p-6">
              <div className="space-y-6">
                {/* Formulário para novo comentário */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Adicionar Comentário
                  </h3>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Digite seu comentário..."
                      value={novoComentario}
                      onChange={(e) => setNovoComentario(e.target.value)}
                      className="min-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    />
                    <Button
                      onClick={handleAdicionarComentario}
                      disabled={!novoComentario.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                    >
                      Publicar Comentário
                    </Button>
                  </div>
                </div>

                {/* Lista de comentários */}
                <div className="space-y-4">
                  {carregandoComentarios ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Carregando comentários...</p>
                    </div>
                  ) : comentarios.length > 0 ? (
                    comentarios.map((comentario) => (
                      <div
                        key={comentario.id}
                        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {comentario.usuario_nome?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {comentario.usuario_nome || "Usuário"}
                              </h4>
                              <span className="text-gray-500 text-sm">
                                {formatarData(comentario.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {comentario.comentario}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <svg
                        className="w-16 h-16 text-gray-300 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <p className="text-gray-500 text-lg">
                        Nenhum comentário ainda
                      </p>
                      <p className="text-gray-400 text-sm">
                        Seja o primeiro a comentar!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer com ações */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CurtidasButton treinamentoId={treinamento.id} />
            
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
            >
              Fechar
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="px-6 py-2 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
            >
              Baixar
            </Button>
            
            <Button
              onClick={() => onViewPDF(treinamento)}
              className="px-8 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Visualizar Treinamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TreinamentoModal;
