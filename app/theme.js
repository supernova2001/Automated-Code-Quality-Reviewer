import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4F46E5', // Soft indigo
      light: '#818CF8',
      dark: '#3730A3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0EA5E9', // Soft sky blue
      light: '#38BDF8',
      dark: '#0284C7',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F1F5F9', // Soft gray-blue
      paper: '#F8FAFC',   // Soft light for cards/boxes
    },
    text: {
      primary: '#334155', // Soft slate
      secondary: '#64748B', // Muted slate
    },
    error: {
      main: '#F43F5E', // Soft rose
      light: '#FB7185',
      dark: '#E11D48',
    },
    warning: {
      main: '#F59E0B', // Soft amber
      light: '#FBBF24',
      dark: '#D97706',
    },
    success: {
      main: '#10B981', // Soft emerald
      light: '#34D399',
      dark: '#059669',
    },
    grey: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#334155',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#334155',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#334155',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#334155',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#334155',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#334155',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      color: '#475569',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#64748B',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.03)',
          backgroundColor: '#F8FAFC', // Use soft light
          border: '1px solid #E2E8F0', // Subtle border
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#F8FAFC', // Use soft light
          border: '1px solid #E2E8F0', // Subtle border
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#000000',
          color: '#FFFFFF',
          borderRight: '1px solid #222',
          '& .MuiListItemIcon-root, & .MuiListItemText-root, & .MuiSvgIcon-root': {
            color: '#FFFFFF',
          },
        },
      },
    },
  },
});

export default theme; 