import { useState } from 'react';

export const useNotificationSelector = () => {
  const [isNotificationSelectorOpen, setIsNotificationSelectorOpen] = useState(false);
  const [notificationCallback, setNotificationCallback] = useState(null);
  const [notificationConfig, setNotificationConfig] = useState({
    title: "Selecionar Usuários para Notificação",
    subtitle: "Escolha quais usuários devem receber esta notificação"
  });

  const openNotificationSelector = (callback, config = {}) => {
    setNotificationConfig({
      title: config.title || "Selecionar Usuários para Notificação",
      subtitle: config.subtitle || "Escolha quais usuários devem receber esta notificação"
    });
    setNotificationCallback(() => callback);
    setIsNotificationSelectorOpen(true);
  };

  const closeNotificationSelector = () => {
    setIsNotificationSelectorOpen(false);
    setNotificationCallback(null);
  };

  const handleNotificationConfirm = (selectedUserIds, selectedUserData) => {
    if (notificationCallback) {
      notificationCallback(selectedUserIds, selectedUserData);
    }
    closeNotificationSelector();
  };

  return {
    isNotificationSelectorOpen,
    notificationConfig,
    openNotificationSelector,
    closeNotificationSelector,
    handleNotificationConfirm
  };
};

export default useNotificationSelector;
