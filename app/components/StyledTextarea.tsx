import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";

interface StyledTextareaProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  rows?: number; // Will influence height
  error?: string;
}

const StyledTextarea: React.FC<StyledTextareaProps> = ({
  label,
  style,
  containerStyle,
  rows = 4,
  error,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const calculatedHeight = Math.max(48, rows * 20); // Approximate height based on rows

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            commonStyles.textUppercase,
            commonStyles.letterSpacingSmall,
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          commonStyles.dashedBorder,
          { height: calculatedHeight },
          isFocused && styles.inputFocused,
          style,
        ]}
        placeholderTextColor={colors.textLight}
        multiline
        textAlignVertical="top" // Important for multiline
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 8, // Padding for multiline text
    backgroundColor: colors.inputBackground,
    borderRadius: 4,
    fontSize: 16,
    color: colors.textPrimary,
    borderColor: colors.inputBorder,
  },
  inputFocused: {
    borderColor: colors.inputBorderFocused,
    borderWidth: 1,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.error,
  },
});

export default StyledTextarea;
