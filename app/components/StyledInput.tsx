import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

interface StyledInputProps extends Omit<TextFieldProps, 'variant'> {
  // label is already part of TextFieldProps
  containerClassName?: string; // Less relevant with TextField's own layout
}

// If you need the dashed style frequently, you can create a styled component
const DashedTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderStyle: 'dashed',
      borderWidth: '2px',
      borderColor: theme.palette.divider, // stone-400
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main, // Or theme.palette.grey[500]
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main, // Or theme.palette.grey[500]
      borderWidth: '2px', // Ensure focused border width matches
    },
    backgroundColor: theme.palette.background.default, // stone-50
  },
  '& .MuiInputLabel-root': { // Styling for the label
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme.palette.primary.main, // Label color when focused
  },
}));


const StyledInput: React.FC<StyledInputProps> = ({ 
  label, 
  id, 
  containerClassName, // We'll use margin for spacing instead
  className, // Mapped to sx or ignored if not directly applicable
  InputProps,
  sx,
  ...props 
}) => {
  const inputId = id || props.name || label?.toString().toLowerCase().replace(/\s+/g, '-');
  
  return (
    <DashedTextField
      id={inputId}
      label={label}
      fullWidth
      margin="normal" // Provides default spacing, replaces containerClassName="mb-6"
      sx={{
        // Placeholder styling if needed (MUI handles this well by default)
        // '& .MuiInputBase-input::placeholder': {
        //   color: 'palette.grey[400]',
        //   opacity: 1, 
        // },
        ...sx
      }}
      InputProps={InputProps}
      {...props}
    />
  );
};

export default StyledInput;
