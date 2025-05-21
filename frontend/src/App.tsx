import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box } from '@mui/material';
import CodeAnalyzer from './components/CodeAnalyzer';
import AnalysisHistory from './components/AnalysisHistory';
import RepositoryAnalysis from './components/RepositoryAnalysis';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <RepositoryAnalysis />
          <CodeAnalyzer />
          <AnalysisHistory />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default App; 