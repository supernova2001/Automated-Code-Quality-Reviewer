import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
} from '@mui/material';
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Code as CodeIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Code Analyzer', icon: <CodeIcon />, path: '/analysis' },
  { text: 'Analysis History', icon: <DashboardIcon />, path: '/history' },
  { text: 'Repository History', icon: <AssessmentIcon />, path: '/repository' },
  { text: 'Quality Analytics', icon: <BarChartIcon />, path: '/analytics' },
  { text: 'Visualizations', icon: <BarChartIcon />, path: '/visualizations' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Help', icon: <HelpIcon />, path: '/help' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      PaperProps={{
        sx: {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#000', // Black background
          color: '#fff',           // White text
          borderRight: '1px solid #222',
        }
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: '64px' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  color: '#fff',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    '& .MuiListItemIcon-root': { color: '#fff' },
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#fff' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: '#fff',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      </Box>
    </Drawer>
  );
};

export default Sidebar; 