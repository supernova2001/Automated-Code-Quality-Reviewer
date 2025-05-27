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
  Fade
} from '@mui/material';
import {
  Menu as MenuIcon,
  Code as CodeIcon,
  History as HistoryIcon,
  GitHub as GitHubIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import CodeAnalyzer from './components/CodeAnalyzer';
import AnalysisHistory from './components/AnalysisHistory';
import RepositoryAnalysis from './components/RepositoryAnalysis';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#7c3aed',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

const drawerWidth = 240;

const App: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentView, setCurrentView] = useState('analyzer');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Code Analyzer', icon: <CodeIcon />, view: 'analyzer' },
    { text: 'Analysis History', icon: <HistoryIcon />, view: 'history' },
    { text: 'Repository History', icon: <GitHubIcon />, view: 'repository' },
  ];

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main' }}>
          Code Quality
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text}
            onClick={() => {
              setCurrentView(item.view);
              if (isMobile) setMobileOpen(false);
            }}
            selected={currentView === item.view}
          >
            <ListItemIcon sx={{ color: currentView === item.view ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'analyzer':
        return <CodeAnalyzer />;
      case 'history':
        return <AnalysisHistory />;
      case 'repository':
        return <RepositoryAnalysis />;
      default:
        return <CodeAnalyzer />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Automated Code Quality Reviewer
            </Typography>
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
              keepMounted: true,
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
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                borderRight: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              },
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
          <Fade in={true} timeout={500}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3,
                minHeight: 'calc(100vh - 100px)',
                bgcolor: 'background.paper'
              }}
            >
              {renderContent()}
            </Paper>
          </Fade>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App; 