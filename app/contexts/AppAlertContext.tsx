import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertButton, AlertOptions } from 'react-native';
import AppAlertModal from '../components/common/AppAlertModal';

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void;
}

const AppAlertContext = createContext<AlertContextType | undefined>(undefined);

export const AppAlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [alertProps, setAlertProps] = useState<{ title: string; message?: string; buttons?: AlertButton[]; options?: AlertOptions }>({ title: '' });

  const showAlert = (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
    setAlertProps({ title, message, buttons, options });
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
    setAlertProps({ title: '' }); // Reset props
  };

  return (
    <AppAlertContext.Provider value={{ showAlert }}>
      {children}
      <AppAlertModal
        visible={visible}
        title={alertProps.title}
        message={alertProps.message}
        buttons={alertProps.buttons}
        onClose={hideAlert}
      />
    </AppAlertContext.Provider>
  );
};

export const useAppAlert = () => {
  const context = useContext(AppAlertContext);
  if (context === undefined) {
    throw new Error('useAppAlert must be used within an AppAlertProvider');
  }
  return context;
};
