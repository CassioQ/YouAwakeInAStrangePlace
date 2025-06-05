import { Alert, Platform, AlertButton, AlertOptions } from 'react-native';

/**
 * Shows a cross-platform alert.
 * On native, uses React Native's Alert.alert.
 * On web, uses window.alert or window.confirm for a simpler experience.
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
      const firstButton = buttons[0];
      const secondButton = buttons[1];

      // Determine positive and negative actions
      let positiveButton = firstButton;
      let negativeButton = secondButton;

      // Prioritize 'cancel' or 'destructive' style for the "Cancel" part of window.confirm
      if (secondButton.style === 'cancel' || (secondButton.style === 'destructive' && firstButton.style !== 'destructive')) {
        positiveButton = firstButton;
        negativeButton = secondButton;
      } else if (firstButton.style === 'cancel' || (firstButton.style === 'destructive' && secondButton.style !== 'destructive')) {
        positiveButton = secondButton;
        negativeButton = firstButton;
      }
      // If no clear cancel/destructive, or both are destructive, default to first as positive

      let confirmMessage = fullMessage;
      // Clarify button actions if they are not standard OK/Cancel
      if (!['ok', 'sim', 'yes'].includes(positiveButton.text?.toLowerCase() || '') || 
          !['cancelar', 'cancel', 'não', 'no'].includes(negativeButton.text?.toLowerCase() || '')) {
        // This explicit mapping might be too verbose for window.confirm, which has fixed button labels.
        // A simpler approach for non-standard two buttons on web:
        // OK maps to button[0], Cancel maps to button[1]
      }
      
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        if (positiveButton.onPress) {
          positiveButton.onPress();
        }
      } else {
        if (negativeButton.onPress) {
          negativeButton.onPress();
        }
      }
    } else { // 3 or more buttons
      let webMessage = `${fullMessage}\n\nOpções disponíveis: ${buttons.map(b => b.text || 'Ação').join(', ')}.`;
      webMessage += "\nEste alerta web simplificado não suporta múltiplas ações diretas. Nenhuma ação padrão será executada após fechar este alerta.";
      window.alert(webMessage);
      // No automatic onPress for 3+ buttons on web to avoid ambiguity.
      // The user is informed; a custom modal would be needed for full functionality.
      if (options?.cancelable === false && buttons.some(b => b.style === 'cancel')) {
        // If not cancelable and there's a cancel-style button, this scenario is hard to map to window.alert.
        // The user can always dismiss window.alert.
      }
    }
  }
};
