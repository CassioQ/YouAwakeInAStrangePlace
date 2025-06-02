import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

interface StyledTextareaProps extends Omit<TextFieldProps, 'variant' | 'multiline' | 'rows'> {
  // label is already part of TextFieldProps
  containerClassName?: string;
  rows?: number;
}

// Re-use the DashedTextField or create a specific one if styles differ significantly
const DashedTextareaField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    padding: 0, // Remove default padding if textarea needs specific padding for its input element
    '& textarea': {
        padding: theme.spacing(1.5, 1.75), // p-3 like (12px 14px)
    },
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
      borderWidth: '2px',
    },
    backgroundColor: theme.palette.background.default, // stone-50
  },
   '& .MuiInputLabel-root': {
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme.palette.primary.main,
  },
}));

const StyledTextarea: React.FC<StyledTextareaProps> = ({ 
  label, 
  id, 
  containerClassName, 
  className, 
  rows = 4,
  sx,
  ...props 
}) => {
  const textareaId = id || props.name || label?.toString().toLowerCase().replace(/\s+/g, '-');
  
  return (
    <DashedTextareaField
      id={textareaId}
      label={label}
      multiline
      rows={rows}
      fullWidth
      margin="normal"
      sx={sx}
      {...props}
    />
  );
};

export default StyledTextarea;
