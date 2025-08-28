import React, { useState } from 'react';
import TreinamentoCardAdvanced from './TreinamentoCardAdvanced';
import { atualizarOrdemTreinamentos } from '../services/treinamentosService';

const DraggableTreinamentoList = ({
  treinamentos,
  onTreinamentosReordered,
  isDragEnabled = false,
  onEdit,
  onDelete,
  onViewPDF,
  onOpenComments
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Garantir que sempre temos um array válido
  const safeTreinamentos = Array.isArray(treinamentos) ? treinamentos : [];

  const handleDragStart = (e, index) => {
    if (!isDragEnabled) return;
    
    setIsDragging(true);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    if (!isDragEnabled || draggedIndex === null) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    if (!isDragEnabled || draggedIndex === null) return;
    
    e.preventDefault();
    setIsDragging(false);
    setDragOverIndex(null);

    if (draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    // Criar nova ordem dos treinamentos
    const reorderedTreinamentos = Array.from(safeTreinamentos);
    const [movedItem] = reorderedTreinamentos.splice(draggedIndex, 1);
    reorderedTreinamentos.splice(dropIndex, 0, movedItem);

    // Atualizar estado local imediatamente para feedback visual
    onTreinamentosReordered(reorderedTreinamentos);

    // Salvar no banco de dados
    setIsUpdating(true);
    try {
      const { error } = await atualizarOrdemTreinamentos(reorderedTreinamentos);
      
      if (error) {
        console.error('Erro ao salvar nova ordem:', error);
        // Reverter para ordem original em caso de erro
        onTreinamentosReordered(treinamentos);
        alert('Erro ao salvar nova ordem. Tente novamente.');
      } else {
        console.log('✅ Nova ordem salva com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar nova ordem:', error);
      // Reverter para ordem original em caso de erro
      onTreinamentosReordered(treinamentos);
      alert('Erro ao salvar nova ordem. Tente novamente.');
    } finally {
      setIsUpdating(false);
      setDraggedIndex(null);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (!isDragEnabled) {
    // Renderização normal sem drag and drop
    return (
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {safeTreinamentos.map((treinamento, index) => (
          <div
            key={treinamento.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <TreinamentoCardAdvanced
              treinamento={treinamento}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewPDF={onViewPDF}
              onOpenComments={onOpenComments}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Overlay de loading durante atualização */}
      {isUpdating && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
          <div className="bg-white rounded-xl p-6 shadow-2xl flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">Salvando nova ordem...</span>
          </div>
        </div>
      )}

      {/* Indicador de modo de reordenação */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span className="text-blue-800 font-medium">
            Modo de Reordenação Ativo - Arraste os cartões para reorganizar
          </span>
        </div>
      </div>

      {/* Grid com drag-and-drop nativo HTML5 */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {safeTreinamentos.map((treinamento, index) => (
          <div
            key={treinamento.id}
            draggable={isDragEnabled && !isUpdating}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative transition-all duration-200 ${
              draggedIndex === index
                ? 'opacity-50 rotate-2 scale-105'
                : dragOverIndex === index
                ? 'scale-105 bg-blue-50/50 rounded-xl'
                : isDragging && draggedIndex !== index
                ? 'scale-95 opacity-70'
                : 'animate-fade-in-up'
            } ${
              isDragEnabled ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
            style={{ 
              animationDelay: isDragging ? '0ms' : `${index * 100}ms`
            }}
          >
            {/* Handle de arraste */}
            {isDragEnabled && (
              <div
                className={`absolute top-2 right-2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg border-2 border-gray-200 flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 ${
                  draggedIndex === index ? 'bg-blue-100 border-blue-400' : ''
                }`}
                title="Arraste para reordenar"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            )}

            {/* Card do treinamento */}
            <div 
              className={`relative ${
                isDragEnabled && draggedIndex === index ? 'pointer-events-none' : ''
              }`}
              style={{ pointerEvents: isDragEnabled && draggedIndex === index ? 'none' : 'auto' }}
            >
              <TreinamentoCardAdvanced
                treinamento={treinamento}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewPDF={onViewPDF}
                onOpenComments={onOpenComments}
                isDragMode={isDragEnabled}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DraggableTreinamentoList;
