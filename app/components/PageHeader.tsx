import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";

interface PageHeaderProps {
  title: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title }) => {
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => console.log("Menu pressed")}
      >
        <Text style={styles.iconText}>☰</Text>
      </TouchableOpacity>
      <Text
        style={[
          styles.title,
          commonStyles.textUppercase,
          commonStyles.letterSpacingSmall,
        ]}
      >
        {title}
      </Text>
      <View style={styles.statusIcons}>
        <Text style={styles.statusText}>{currentTime}</Text>
        <Text style={styles.iconText}>📶</Text>
        <Text style={styles.iconText}>🔋</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.headerText,
  },
  statusIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  iconText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginHorizontal: 4,
  },
});

export default PageHeader;
