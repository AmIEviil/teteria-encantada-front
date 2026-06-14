import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    // MUI corre augmentColor (darken/contrast) sobre estos valores: deben ser
    // colores reales (hex/rgb), no CSS vars var(--...) o lanza MUI error #9.
    // Hex tomados de index.css :root.
    primary: {
      main: '#8d9b6d',
      light: '#c4c9c5',
      dark: '#ead2b3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8d4e73',
      light: '#ffffff',
      dark: '#faade0',
    },
    error: {
      main: '#b45461',
      dark: '#923946',
      light: '#7c2e3a',
    },
    background: {
      default: '#f7f0e6',
      paper: '#fffdf9',
    },
    text: {
      primary: '#2f2a20',
      secondary: '#5f5448',
    },
  },
  typography: {
    fontFamily: 'var(--font-body)',
    h1: { fontFamily: 'var(--font-title)' },
    h2: { fontFamily: 'var(--font-title)' },
    body1: { lineHeight: 1.5 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-sm) var(--space-md)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderRadius: 'var(--radius-sm)',
          },
        },
      },
    },
  },
});

export default theme;
