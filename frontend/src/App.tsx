import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  Container, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  useMediaQuery,
  Paper,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Code as CodeIcon,
  History as HistoryIcon,
  GitHub as GitHubIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import CodeAnalyzer from './components/CodeAnalyzer';
import UserCodeAnalyzer from './components/UserCodeAnalyzer';
import AnalysisHistory from './components/AnalysisHistory';
import RepositoryAnalysis from './components/RepositoryAnalysis';
import HomePage from './components/HomePage';
import AnalysisPage from './components/AnalysisPage';
import HomeIcon from '@mui/icons-material/Home';
import BarChartIcon from '@mui/icons-material/BarChart';
import VisualizationsPage from './components/VisualizationsPage';
import axios from 'axios';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F172A',
      light: '#1E293B',
      dark: '#020617',
    },
    secondary: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: alpha('#3B82F6', 0.1),
            '&:hover': {
              backgroundColor: alpha('#3B82F6', 0.15),
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '1px 0 3px 0 rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

const drawerWidth = 240;

const App: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [receivedCode, setReceivedCode] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(() => sessionStorage.getItem('isAdmin') === 'true');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAdminViewClick = () => {
    setAdminDialogOpen(true);
    setSecurityAnswer('');
    setShowCode(false);
    setReceivedCode('');
    setCodeInput('');
    setCodeError('');
  };

  const handleSecuritySubmit = async () => {
    try {
      const res = await axios.post(`http://localhost:8000/api/admin/auth`, { answer: securityAnswer });
      setReceivedCode(res.data.code);
      setShowCode(true);
    } catch (err) {
      setCodeError('Incorrect answer.');
    }
  };

  const handleCodeSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/admin/verify', { code: codeInput });
      if (res.data.admin) {
        setAdminUnlocked(true);
        sessionStorage.setItem('isAdmin', 'true');
        setAdminDialogOpen(false);
      } else {
        setCodeError('Invalid code.');
      }
    } catch {
      setCodeError('Invalid code.');
    }
  };

  const handleAdminLogout = () => {
    setAdminUnlocked(false);
    sessionStorage.removeItem('isAdmin');
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, page: 'home' },
    { text: 'Code Analysis (Admin)', icon: <CodeIcon />, page: 'analyzer', adminOnly: true },
    { text: 'Code Analysis (User)', icon: <PersonIcon />, page: 'user-analyzer' },
    { text: 'Analysis History', icon: <HistoryIcon />, page: 'history' },
    { text: 'Repository Analysis', icon: <GitHubIcon />, page: 'repository' },
    { text: 'Visualizations', icon: <BarChartIcon />, page: 'visualizations' },
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ minHeight: '64px' }} />
      <List sx={{ px: 2 }}>
        {menuItems.filter(item => !item.adminOnly || adminUnlocked).map((item) => (
          <ListItem 
            button 
            key={item.text}
            onClick={() => {
              setCurrentPage(item.page);
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
            selected={currentPage === item.page}
            sx={{
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: alpha('#3B82F6', 0.05),
              },
            }}
          >
            <ListItemIcon sx={{ 
              color: currentPage === item.page ? 'primary.main' : 'text.secondary',
              minWidth: 40,
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                fontWeight: currentPage === item.page ? 600 : 400,
                color: currentPage === item.page ? 'primary.main' : 'text.primary',
              }}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'analyzer':
        return <CodeAnalyzer />;
      case 'user-analyzer':
        return <UserCodeAnalyzer />;
      case 'history':
        return <AnalysisHistory />;
      case 'repository':
        return <RepositoryAnalysis />;
      case 'visualizations':
        return <VisualizationsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ minHeight: '64px' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              Code Quality Reviewer
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {adminUnlocked ? (
              <Button 
                color="inherit" 
                onClick={handleAdminLogout}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' }
                }}
              >
                Logout Admin
              </Button>
            ) : (
              <Button 
                color="inherit" 
                onClick={handleAdminViewClick}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' }
                }}
              >
                Admin View
              </Button>
            )}
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: '64px'
          }}
        >
          <Container maxWidth="xl">
            {renderPage()}
          </Container>
        </Box>
      </Box>
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)}>
        <DialogTitle>Admin Authentication</DialogTitle>
        <DialogContent>
          {!showCode ? (
            <>
              <Typography gutterBottom>Security Question: What is the admin passphrase?</Typography>
              <TextField
                label="Answer"
                fullWidth
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
                sx={{ mt: 2 }}
              />
              {codeError && <Typography color="error" sx={{ mt: 1 }}>{codeError}</Typography>}
            </>
          ) : (
            <>
              <Typography gutterBottom>Correct! Your admin code is:</Typography>
              <Paper sx={{ p: 2, mb: 2, mt: 1, fontWeight: 'bold', fontSize: 18 }}>{receivedCode}</Paper>
              <Typography gutterBottom>Enter the code below to unlock admin view:</Typography>
              <TextField
                label="Admin Code"
                fullWidth
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                sx={{ mt: 2 }}
              />
              {codeError && <Typography color="error" sx={{ mt: 1 }}>{codeError}</Typography>}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!showCode ? (
            <Button onClick={handleSecuritySubmit} variant="contained">Submit</Button>
          ) : (
            <Button onClick={handleCodeSubmit} variant="contained">Unlock Admin</Button>
          )}
          <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default App; 