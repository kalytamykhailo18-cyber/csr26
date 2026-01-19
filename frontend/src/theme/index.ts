import { createTheme } from '@mui/material/styles';

// MUI Theme - per design_rule.txt
// Border radius: Maximum 6px for all elements
const theme = createTheme({
  shape: {
    borderRadius: 6, // Default border radius for all MUI components
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none', // No uppercase transformation
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 6,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
  palette: {
    primary: {
      main: '#0D6EFD',
      light: '#3D8BFD',
      dark: '#0A58CA',
    },
    secondary: {
      main: '#6C757D',
      light: '#858E96',
      dark: '#565E64',
    },
    success: {
      main: '#198754',
      light: '#20A36E',
      dark: '#146C43',
    },
    error: {
      main: '#DC3545',
      light: '#E35D6A',
      dark: '#B02A37',
    },
    warning: {
      main: '#FFC107',
      light: '#FFCD39',
      dark: '#CC9A06',
    },
    info: {
      main: '#0DCAF0',
      light: '#3DD5F3',
      dark: '#0AA2C0',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212529',
      secondary: '#6C757D',
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
});

export default theme;
