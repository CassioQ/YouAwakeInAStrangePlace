import React from 'react';
import Button, { ButtonProps as MuiButtonProps } from '@mui/material/Button';

interface StyledButtonProps extends MuiButtonProps {
  children: React.ReactNode;
  // MUI Button's variant prop can be 'text', 'outlined', 'contained'
  // We'll map our 'primary' to 'contained' and 'secondary' to 'outlined' or another MUI variant
}

const StyledButton: React.FC<StyledButtonProps> = ({ 
  children, 
  variant = 'contained', // Default to MUI's contained
  color = 'primary',   // Default to MUI's primary
  fullWidth = true,    // Keep the w-full behavior
  sx,
  ...props 
}) => {
  // The muiVariant and muiColor are now directly the variant and color props.
  // The logic to interpret 'props_variant' is handled by CustomStyledButton.
  return (
    <Button
      variant={variant}
      color={color}
      fullWidth={fullWidth}
      sx={{ 
        py: 1.5, // py-3 equivalent (MUI uses 8px scale, so 1.5 * 8px = 12px)
        px: 2,   // px-4 equivalent
        // Additional custom styles can be merged here
        ...sx 
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

// Helper to manage our old variant prop name
const CustomStyledButton: React.FC<StyledButtonProps & { props_variant?: 'primary' | 'secondary' }> = ({
  props_variant,
  ...rest
}) => {
  let muiVariant: MuiButtonProps['variant'] = rest.variant || 'contained';
  let muiColor: MuiButtonProps['color'] = rest.color || 'primary';

  if (props_variant === 'primary') {
    muiVariant = 'contained';
    muiColor = 'primary';
  } else if (props_variant === 'secondary') {
    muiVariant = 'contained'; // Using contained secondary as per theme for a filled secondary button
    muiColor = 'secondary';
    // If an outlined secondary is preferred:
    // muiVariant = 'outlined';
    // muiColor = 'primary'; // or 'inherit' or a custom color
  }
  
  return <StyledButton {...rest} variant={muiVariant} color={muiColor} />;
}


export default CustomStyledButton;