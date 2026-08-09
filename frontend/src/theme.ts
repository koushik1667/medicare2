import { createTheme } from '@mui/material/styles';

export const organicTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#FDFCF8', // Rice Paper Off-white
      paper: '#FEFEFA',   // Soft Warm White
    },
    text: {
      primary: '#2C2C24',   // Deep Loam / Charcoal
      secondary: '#78786C', // Dried Grass
    },
    primary: {
      main: '#5D7052',       // Moss Green
      light: '#849A77',
      dark: '#44533C',
      contrastText: '#F3F4F1', // Pale Mist
    },
    secondary: {
      main: '#C18C5D',       // Terracotta / Clay
      light: '#D6A87E',
      dark: '#9A6A40',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#A85448',       // Burnt Sienna
    },
    warning: {
      main: '#D97706',
    },
    info: {
      main: '#5D7052',
    },
    success: {
      main: '#4D7C5D',       // Forest Moss
    },
    divider: 'rgba(222, 216, 207, 0.8)', // Raw Timber
  },
  typography: {
    fontFamily: '"Nunito", "Quicksand", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
      color: '#2C2C24',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
      color: '#2C2C24',
      letterSpacing: '-0.015em',
    },
    h3: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
      color: '#2C2C24',
    },
    h4: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
      color: '#2C2C24',
    },
    h5: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
      color: '#2C2C24',
    },
    h6: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 600,
      color: '#2C2C24',
    },
    button: {
      fontFamily: '"Nunito", sans-serif',
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 24, // 24px default organic soft radius
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FDFCF8',
          color: '#2C2C24',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // Pill-shaped buttons
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '10px',
          paddingBottom: '10px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            transform: 'translateY(-2px) scale(1.03)',
            boxShadow: '0 8px 24px -4px rgba(93, 112, 82, 0.25)',
          },
          '&:active': {
            transform: 'scale(0.96)',
          },
        },
        containedPrimary: {
          backgroundColor: '#5D7052',
          color: '#F3F4F1',
          boxShadow: '0 4px 20px -2px rgba(93, 112, 82, 0.25)',
          '&:hover': {
            backgroundColor: '#44533C',
            boxShadow: '0 8px 25px -3px rgba(93, 112, 82, 0.35)',
          },
        },
        containedSecondary: {
          backgroundColor: '#C18C5D',
          color: '#FFFFFF',
          boxShadow: '0 4px 20px -2px rgba(193, 140, 93, 0.25)',
          '&:hover': {
            backgroundColor: '#9A6A40',
            boxShadow: '0 8px 25px -3px rgba(193, 140, 93, 0.35)',
          },
        },
        outlinedPrimary: {
          borderColor: '#5D7052',
          borderWidth: '2px',
          color: '#5D7052',
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: 'rgba(93, 112, 82, 0.08)',
          },
        },
        outlinedSecondary: {
          borderColor: '#C18C5D',
          borderWidth: '2px',
          color: '#C18C5D',
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: 'rgba(193, 140, 93, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '2rem',
          backgroundColor: '#FEFEFA',
          border: '1px solid rgba(222, 216, 207, 0.7)',
          boxShadow: '0 6px 24px -4px rgba(93, 112, 82, 0.12)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: '0 12px 36px -6px rgba(93, 112, 82, 0.18)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#FEFEFA',
          borderRadius: '1.5rem',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // Pill-shaped inputs
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          '& fieldset': {
            borderColor: '#DED8CF',
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: '#5D7052 !important',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#5D7052 !important',
            borderWidth: '2px !important',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 700,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(253, 252, 248, 0.85)',
          backdropFilter: 'blur(12px)',
          color: '#2C2C24',
          boxShadow: '0 4px 20px rgba(93, 112, 82, 0.08)',
          borderBottom: '1px solid rgba(222, 216, 207, 0.6)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FDFCF8',
          borderRight: '1px solid rgba(222, 216, 207, 0.6)',
        },
      },
    },
  },
});

export default organicTheme;
