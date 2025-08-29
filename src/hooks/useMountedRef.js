import { useRef, useEffect } from 'react';

/**
 * Hook personalizado para rastrear se um componente ainda está montado
 * Útil para prevenir atualizações de estado em componentes desmontados
 * 
 * @returns {React.MutableRefObject<boolean>} Ref que indica se o componente está montado
 */
export const useMountedRef = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Marcar como desmontado quando o componente for desmontado
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
};

export default useMountedRef;
