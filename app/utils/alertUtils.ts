import { Alert, Platform, AlertButton, AlertOptions } from 'react-native';

// This will be set by the AppAlertProvider on web
let webShowAlert: ((title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void) | undefined;

export const setWebShowAlert = (func: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void) => {
  webShowAlert = func;
};

/**
 * Shows a cross-platform alert.
 * On native, uses React Native's Alert.alert.
 * On web, uses a custom modal if configured, otherwise falls back to window.alert/confirm.
 *
 * @param title The alert title.
 * @param message The alert message.
 * @param buttons Optional array of buttons (AlertButton[]).
 * @param options Optional alert options (AlertOptions).
 */
export const showAppAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
): void => {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons, options);
  } else {
    if (webShowAlert) {
      webShowAlert(title, message, buttons, options);
    } else {
      // Fallback for web if AppAlertProvider is not used or configured
      const fullMessage = message ? `${title}\n\n${message}` : title;

      if (!buttons || buttons.length === 0) {
        window.alert(fullMessage);
        return;
      }

      if (buttons.length === 1) {
        window.alert(fullMessage);
        if (buttons[0].onPress) {
          buttons[0].onPress();
        }
      } else if (buttons.length === 2) {
        const confirmed = window.confirm(fullMessage);
        const firstButton = buttons[0];
        const secondButton = buttons[1];

        // Simple mapping for window.confirm: OK maps to first button, Cancel maps to second
        if (confirmed) {
          if (firstButton.onPress) {
            firstButton.onPress();
          }
        } else {
          if (secondButton.onPress) {
            secondButton.onPress();
          }
        }
      } else { // 3 or more buttons
        let webMessage = `${fullMessage}\n\nOpções disponíveis: ${buttons.map(b => b.text || 'Ação').join(', ')}.`;
        webMessage += "\nEste alerta web simplificado não suporta múltiplas ações diretas. Nenhuma ação padrão será executada após fechar este alerta.";
        window.alert(webMessage);
      }
    }
  }
};