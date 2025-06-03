import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";

interface PageHeaderProps {
  title: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title }) => {
  const context = useContext(AppContext);
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

  const handleMenuPress = () => {
    if (context?.currentUser) {
      if (Platform.OS === "web") {
        context.logout();
      } else {
        handleLogoutApp();
      }
    } else {
      console.log("Menu pressed (not logged in)");
      context?.navigateTo(ScreenEnum.LOGIN);
    }
  };

  const handleLogoutApp = () => {
    if (context?.currentUser) {
      Alert.alert(
        "Logout",
        "Tem certeza que deseja sair?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Sair", onPress: () => context.logout() },
        ],
        { cancelable: true }
      );
    } else {
      Alert.alert("Atenção", "Você não está logado.");
    }
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.menuButton}
        accessibilityLabel={
          context?.currentUser ? "Abrir menu de logout" : "Abrir menu"
        }
      >
        <Text onPress={handleMenuPress} style={styles.iconText}>
          ☰
        </Text>
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
