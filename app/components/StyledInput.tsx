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

interface StyledInputProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  error?: string; // For displaying error messages
}

const StyledInput: React.FC<StyledInputProps> = ({
  label,
  style,
  containerStyle,
  error,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

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
          isFocused && styles.inputFocused,
          style,
        ]}
        placeholderTextColor={colors.textLight}
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
    marginBottom: 16, // margin="normal" equivalent
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  input: {
    height: 48, // Standard input height
    paddingHorizontal: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 4, // Dashed border doesn't look good with high radius in RN
    fontSize: 16,
    color: colors.textPrimary,
    borderColor: colors.inputBorder, // From commonStyles.dashedBorder
  },
  inputFocused: {
    borderColor: colors.inputBorderFocused,
    borderWidth: 1, // Ensure focus border width matches
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.error,
  },
});

export default StyledInput;
