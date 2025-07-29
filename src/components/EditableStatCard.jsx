import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const EditableStatCard = ({ 
  icon: Icon, 
  value, 
  title, 
  subtitle, 
  iconBgColor, 
  iconColor,
  statKey,
  onSave 
}) => {
  const { user, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSave(statKey, editValue);
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="text-center p-6 bg-white rounded-lg shadow-sm border relative group">
      {/* Botão de editar (apenas para admins) */}
      {isAdmin && !isEditing && (
        <button
          onClick={handleEdit}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-100"
          title="Editar"
        >
          <Edit2 size={14} className="text-gray-500" />
        </button>
      )}

      {/* Botões de salvar/cancelar (durante edição) */}
      {isEditing && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 rounded-full hover:bg-green-100 text-green-600 disabled:opacity-50"
            title="Salvar"
          >
            <Check size={14} />
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 rounded-full hover:bg-red-100 text-red-600 disabled:opacity-50"
            title="Cancelar"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex justify-center mb-4">
        <div className={`${iconBgColor} rounded-full p-3`}>
          <Icon className={iconColor} size={32} />
        </div>
      </div>

      {/* Valor editável */}
      <div className="text-3xl font-bold text-gray-900 mb-2">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full text-center text-3xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600"
            autoFocus
            disabled={isSaving}
          />
        ) : (
          <span className={isAdmin ? 'cursor-pointer hover:text-blue-600' : ''}>
            {value}
          </span>
        )}
      </div>

      <div className="text-gray-600 font-medium">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{subtitle}</div>

      {/* Indicador de salvamento */}
      {isSaving && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Salvando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableStatCard;

