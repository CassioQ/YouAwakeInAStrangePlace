import { StyleSheet, Platform } from "react-native";
import { colors } from "./colors";

export const commonStyles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardContainer: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  // Typography
  textUppercase: {
    textTransform: "uppercase",
  },
  letterSpacingSmall: {
    letterSpacing: 0.5,
  },
  letterSpacingMedium: {
    letterSpacing: 1,
  },
  fontWeightBold: {
    fontWeight: "bold",
  },
  fontWeightMedium: {
    fontWeight: "500",
  },
  textCenter: {
    textAlign: "center",
  },
  // Dashed border style
  dashedBorder: {
    borderStyle: "dashed",
    borderWidth: 1, // React Native typically uses 1 for dashed borders unless very specific
    borderColor: colors.inputBorder,
  },
});
