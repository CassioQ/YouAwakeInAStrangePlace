import React, { ReactNode } from 'react';
import PageHeader from './PageHeader';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

interface ScreenWrapperProps {
  title: string;
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disableGutters?: boolean;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ title, children, maxWidth = 'md', disableGutters = false }) => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <PageHeader title={title} />
      <Container
        component="main"
        maxWidth={maxWidth}
        disableGutters={disableGutters}
        sx={{ 
          flexGrow: 1, 
          py: { xs: 2, md: 3 }, // p-6 md:p-8 equivalent
          px: { xs: 2, md: 3 } 
        }}
      >
         {/* Centering content if maxWdith is 'md' or less, similar to previous max-w-md mx-auto */}
        <Box sx={{ maxWidth: title === 'HOME' ? '100%' : 'sm', mx: 'auto' }}> 
          {children}
        </Box>
      </Container>
    </Box>
  );
};

export default ScreenWrapper;
