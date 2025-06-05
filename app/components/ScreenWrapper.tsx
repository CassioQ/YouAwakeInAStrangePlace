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
  childHandlesScrolling?: boolean; // New prop
}

const screenWidth = Dimensions.get("window").width;
const MAX_CONTENT_WIDTH = 500;

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  title,
  children,
  disableGutters = false,
  childHandlesScrolling = false,
}) => {
  const contentMaxWidth =
    title === "HOME"
      ? screenWidth
      : Math.min(screenWidth * 0.9, MAX_CONTENT_WIDTH);

  const content = (
    <View
      style={[
        styles.contentContainer,
        { maxWidth: contentMaxWidth },
        !disableGutters ? styles.gutters : {},
        childHandlesScrolling ? { flex: 1 } : {},
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader title={title} />
      {childHandlesScrolling ? (
        content
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      )}
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
  scrollViewContentContainer: {
    flexGrow: 1,
    alignItems: "center",
  },
  contentContainer: {
    width: "100%",
  },
  gutters: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
});

export default ScreenWrapper;
