import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native"; // Alert removed
import { colors } from "../styles/colors";
import { commonStyles } from "../styles/commonStyles";
import { AppContext } from "../contexts/AppContexts";
import { ScreenEnum } from "../models/enums/CommomEnuns";
import { showAppAlert } from '../utils/alertUtils'; // Import the utility

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
    }, 60000); 
    return () => clearInterval(timer);
  }, []);

  const handleMenuPress = () => {
    if (context?.currentUser) {
      // On web, direct logout is fine. On native, confirm.
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
      showAppAlert( // Replaced
        "Logout",
        "Tem certeza que deseja sair?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Sair", onPress: () => context.logout() },
        ],
        { cancelable: true }
      );
    } else {
      showAppAlert("Atenção", "Você não está logado."); // Replaced
    }
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.menuButton}
        accessibilityLabel={
          context?.currentUser ? "Abrir menu de logout" : "Abrir menu"
        }
        onPress={handleMenuPress} // Added onPress here
      >
        <Text style={styles.iconText}>
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
    justifyContent: "space-between", // Changed to space-between for better title centering
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuButton: {
    padding: 8,
    position: 'absolute', // To allow title to center properly
    left: 8, 
    zIndex: 1,
  },
  title: {
    flex: 1, // Allow title to take available space for centering
    textAlign: 'center', // Center title text
    fontSize: 18,
    fontWeight: "500",
    color: colors.headerText,
  },
  iconText: {
    fontSize: 20, // Made icon slightly larger
    color: colors.textSecondary,
  },
  // statusIcons and statusText are removed as per previous UI updates.
});

export default PageHeader;
