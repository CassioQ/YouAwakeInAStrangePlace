import { createTheme } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

// Define the shape of our 'stone' color object
interface StoneShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

// Extend MUI's Palette and PaletteOptions interfaces
declare module "@mui/material/styles/createPalette" {
  interface Palette {
    stone: StoneShades;
  }
  interface PaletteOptions {
    stone?: StoneShades;
  }
}

// Define a theme based on the "stone" palette
const theme = createTheme({
  palette: {
    primary: {
      main: grey[800], //  Stone-700 equivalent for primary actions
      contrastText: "#fff",
    },
    secondary: {
      main: grey[300], // Stone-200 for secondary button background
      contrastText: grey[800], // Stone-700 for secondary button text
    },
    background: {
      default: grey[50], // Stone-50
      paper: "#ffffff", // For cards, dialogs etc.
    },
    text: {
      primary: grey[900], // Darker text (stone-700/800)
      secondary: grey[700], // Lighter text (stone-600)
    },
    divider: grey[400], // Stone-400
    action: {
      active: grey[700], // For icons and active elements
    },
    // Custom colors if needed, though try to map to MUI's structure
    stone: {
      50: grey[50],
      100: grey[100],
      200: grey[200],
      300: grey[300],
      400: grey[400],
      500: grey[500],
      600: grey[600],
      700: grey[700],
      800: grey[800],
      900: grey[900],
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h1: {
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      fontSize: "1.5rem", // Adjust as needed
    },
    h2: {
      fontSize: "1.25rem",
    },
    // Add other typography variants as needed
    button: {
      textTransform: "none", // Default MUI buttons are uppercase
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Rounded-md equivalent
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: grey[900], // Darken primary on hover
          },
        },
        containedSecondary: {
          border: `1px solid ${grey[400]}`, // Stone-400 border for secondary
          "&:hover": {
            backgroundColor: grey[400], // Darken secondary on hover
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: grey[100], // Stone-100 for header background
          color: grey[800], // Text color for AppBar
          boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)", // shadow-sm
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${grey[300]}`, // stone-200
          boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)", // default shadow
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff", // Ensure paper is white by default if not overridden
        },
      },
    },
  },
});

export default theme;
