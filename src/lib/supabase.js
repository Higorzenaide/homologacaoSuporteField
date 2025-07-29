import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  storage: {
    bucketName: 'arquivos'
  }
});

// Configurações do Storage
export const STORAGE_BUCKET = 'arquivos';
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
export const ALLOWED_EXTENSIONS = ['pdf', 'ppt', 'pptx'];

// Funções utilitárias para o Storage
export const getFileUrl = (filePath) => {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

export const uploadFile = async (file, filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro no upload:', error);
    return { data: null, error };
  }
};

export const deleteFile = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return { data: null, error };
  }
};

// Funções para validação de arquivos
export const validateFile = (file) => {
  const errors = [];

  // Verificar tamanho
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`Arquivo muito grande. Máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Verificar tipo
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    errors.push(`Tipo de arquivo não permitido. Permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // Verificar extensão
  const extension = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    errors.push(`Extensão não permitida. Permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Função para gerar nome único de arquivo
export const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
};

// Função para gerar caminho do arquivo
export const generateFilePath = (category, fileName) => {
  const sanitizedCategory = category.toLowerCase().replace(/\s+/g, '-');
  return `treinamentos/${sanitizedCategory}/${fileName}`;
};

export default supabase;

