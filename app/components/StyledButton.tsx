import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from "react-native";
import { colors } from "../styles/colors";

interface StyledButtonProps extends TouchableOpacityProps {
  children?: React.ReactNode;
  props_variant?: "primary" | "secondary";
  fullWidth?: boolean;
  size?: "small" | "medium" | "large";
  textStyle?: TextStyle;
}

const StyledButton: React.FC<StyledButtonProps> = ({
  children,
  props_variant = "primary",
  style,
  textStyle,
  fullWidth = true, // In RN, views/touchables often take width of parent or content
  size = "medium",
  disabled,
  ...props
}) => {
  const buttonStyles: ViewStyle[] = [styles.buttonBase];
  const textStyles: TextStyle[] = [styles.textBase];

  if (props_variant === "primary") {
    buttonStyles.push(styles.buttonPrimary);
    textStyles.push(styles.textPrimary);
  } else if (props_variant === "secondary") {
    buttonStyles.push(styles.buttonSecondary);
    textStyles.push(styles.textSecondary);
  }

  if (size === "small") {
    buttonStyles.push(styles.buttonSmall);
    textStyles.push(styles.textSmall);
  }

  if (disabled) {
    buttonStyles.push(styles.buttonDisabled);
    textStyles.push(styles.textDisabled);
  }

  if (style) {
    buttonStyles.push(style as ViewStyle);
  }
  if (textStyle) {
    textStyles.push(textStyle);
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <Text style={textStyles}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    paddingVertical: 12, // py: 1.5 in MUI (12px)
    paddingHorizontal: 16, // px: 2 in MUI (16px)
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48, // Good touch target size
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  buttonDisabled: {
    backgroundColor: colors.stone300,
    opacity: 0.7,
  },
  textBase: {
    fontSize: 16,
    fontWeight: "600",
  },
  textPrimary: {
    color: colors.primaryContrast,
  },
  textSecondary: {
    color: colors.secondaryContrast,
  },
  textDisabled: {
    color: colors.stone700,
  },
  // Size variants
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  textSmall: {
    fontSize: 14,
  },
});

// CustomStyledButton is no longer needed as props_variant is handled directly.
export default StyledButton;
