import React, { ReactNode } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from "react-native";
import PageHeader from "./PageHeader";
import { colors } from "../styles/colors";

interface ScreenWrapperProps {
  title: string;
  children?: ReactNode;
  disableGutters?: boolean;
}

const screenWidth = Dimensions.get("window").width;
const MAX_CONTENT_WIDTH = 500; // Equivalent to 'sm' in MUI

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  title,
  children,
  disableGutters = false,
}) => {
  const contentMaxWidth =
    title === "HOME"
      ? screenWidth
      : Math.min(screenWidth * 0.9, MAX_CONTENT_WIDTH);

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader title={title} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          disableGutters ? {} : styles.gutters,
        ]}
        keyboardShouldPersistTaps="handled" // Good practice for scrollviews with inputs
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  gutters: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  contentContainer: {
    width: "100%",
  },
});

export default ScreenWrapper;
