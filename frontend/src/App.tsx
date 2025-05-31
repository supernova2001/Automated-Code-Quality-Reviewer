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
  Button
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
    fontFamily: [
      'Inter',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
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
      <Toolbar />
      <List>
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
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
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
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
            <Typography variant="h6" noWrap component="div">
              Code Quality Reviewer
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {adminUnlocked && (
              <Button color="inherit" onClick={handleAdminLogout}>Logout Admin</Button>
            )}
            {!adminUnlocked && (
              <Button color="inherit" onClick={handleAdminViewClick}>Admin View</Button>
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