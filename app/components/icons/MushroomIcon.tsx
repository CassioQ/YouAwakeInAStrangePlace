import React from "react";
import {
  Text,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors } from "../../styles/colors";

interface MushroomIconProps {
  style?: StyleProp<ViewStyle>;
  size?: number;
}

const MushroomIcon: React.FC<MushroomIconProps> = ({ style, size = 80 }) => {
  // This is a placeholder. For actual SVG, use react-native-svg.
  return (
    <View style={[styles.placeholder, { width: size, height: size }, style]}>
      <Text style={[styles.text, { fontSize: size * 0.2 }]}>🍄</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.stone200,
    borderRadius: 10,
  },
  text: {
    color: colors.textPrimary,
  },
});

export default MushroomIcon;
