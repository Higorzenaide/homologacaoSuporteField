import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import CurtidasButton from "./CurtidasButton";
import EditDeleteActions from "./EditDeleteActions";
import { contarComentarios } from "../services/comentariosService";

const TreinamentoCardAdvanced = ({
  treinamento,
  onEdit,
  onDelete,
  onViewPDF,
  onOpenComments,
}) => {
  const { isAdmin } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [comentariosCount, setComentariosCount] = useState(0);

  // Carregar contador de comentários
  useEffect(() => {
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

    if (treinamento.id) {
      carregarContadorComentarios();
    }
  }, [treinamento.id]);

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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

  const getTipoIcon = (tipo) => {
    if (tipo?.toLowerCase() === "pdf") {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
    );
  };

  return (
    <div
      className={`
        group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl 
        transition-all duration-700 transform hover:-translate-y-2 
        overflow-hidden border border-gray-100 cursor-pointer
        backdrop-blur-sm bg-opacity-95
        ${isHovered ? "scale-[1.02]" : "scale-100"}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header com design corporativo moderno */}
      <div
        className={`relative bg-gradient-to-br ${getCategoriaColor(
          treinamento.categoria
        )} p-6 text-white overflow-hidden min-h-[140px] flex flex-col justify-between`}
      >
        {/* Padrão geométrico de fundo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute top-8 right-8 w-16 h-16 bg-white rounded-full opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 bg-white rounded-full opacity-60"></div>
        </div>

        {/* Gradiente overlay para melhor legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20"></div>

        <div className="relative z-10">
          {/* Linha superior com tipo e ações */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              {/* Ícone do tipo de arquivo */}
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                {treinamento.logo_url ? (
                  <img
                    src={treinamento.logo_url}
                    alt="Logo"
                    className={`w-8 h-8 object-contain transition-opacity duration-300 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(false)}
                  />
                ) : (
                  <div className="text-white/90">
                    {getTipoIcon(treinamento.tipo)}
                  </div>
                )}
              </div>

              {/* Badge do tipo */}
              <div className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm border border-white/30 uppercase tracking-wide">
                {treinamento.tipo || 'PDF'}
              </div>
            </div>

            {/* Ações do admin */}
            {isAdmin && (
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <EditDeleteActions
                  item={treinamento}
                  type="treinamento"
                  onEdit={() => onEdit(treinamento)}
                  onDelete={() => onDelete(treinamento)}
                />
              </div>
            )}
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold mb-3 line-clamp-2 leading-tight text-white drop-shadow-sm">
            {treinamento.titulo}
          </h3>

          {/* Informações da linha inferior */}
          <div className="flex items-center justify-between text-white/90 text-sm">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
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
            
            {/* Badge da categoria */}
            {treinamento.categoria && (
              <div className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm border border-white/30">
                {treinamento.categoria}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal do card */}
      <div className="p-6 space-y-4">
        {/* Descrição */}
        {treinamento.descricao && (
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
            {treinamento.descricao}
          </p>
        )}

        {/* Tags com design melhorado */}
        {(() => {
          const tags = Array.isArray(treinamento.tags)
            ? treinamento.tags
            : typeof treinamento.tags === "string"
            ? treinamento.tags.split(",").map((tag) => tag.trim())
            : [];

          return (
            tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 3).map((tag, index) => {
                  const colors = [
                    "bg-blue-50 text-blue-700 border-blue-200",
                    "bg-green-50 text-green-700 border-green-200", 
                    "bg-purple-50 text-purple-700 border-purple-200",
                    "bg-orange-50 text-orange-700 border-orange-200",
                    "bg-pink-50 text-pink-700 border-pink-200",
                  ];
                  const colorClass = colors[index % colors.length];

                  return (
                    <span
                      key={index}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 hover:scale-105 ${colorClass}`}
                    >
                      #{tag}
                    </span>
                  );
                })}
                {tags.length > 3 && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                    +{tags.length - 3}
                  </span>
                )}
              </div>
            )
          );
        })()}

        {/* Estatísticas com design corporativo */}
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
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
              <div>
                <div className="text-sm font-semibold text-gray-900">{treinamento.visualizacoes || 0}</div>
                <div className="text-xs text-gray-500">Visualizações</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{treinamento.downloads || 0}</div>
                <div className="text-xs text-gray-500">Downloads</div>
              </div>
            </div>
          </div>

          {/* Tamanho do arquivo */}
          {treinamento.arquivo_tamanho && (
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {(treinamento.arquivo_tamanho / (1024 * 1024)).toFixed(1)} MB
              </div>
              <div className="text-xs text-gray-500">Tamanho</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer com ações */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            {/* Botão de curtidas melhorado */}
            <CurtidasButton treinamentoId={treinamento.id} />

            {/* Botão de comentários melhorado */}
            <button
              onClick={() => onOpenComments(treinamento)}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:shadow-md transition-all duration-300 transform hover:scale-105 font-medium text-sm"
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
              <span>{comentariosCount}</span>
            </button>
          </div>

          {/* Botão de visualizar principal */}
          <button
            onClick={() => onViewPDF(treinamento)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl font-semibold text-sm group"
          >
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
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
            <span>Visualizar</span>
          </button>
        </div>
      </div>

      {/* Efeito de brilho corporativo no hover */}
      <div
        className={`
        absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 
        transform -skew-x-12 transition-all duration-1000 pointer-events-none
        ${isHovered ? "opacity-10 translate-x-full" : "-translate-x-full"}
      `}
      ></div>

      {/* Indicador de hover sutil */}
      <div
        className={`
        absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getCategoriaColor(treinamento.categoria)} 
        transform origin-left transition-transform duration-300
        ${isHovered ? "scale-x-100" : "scale-x-0"}
      `}
      ></div>
    </div>
  );
};

export default TreinamentoCardAdvanced;
