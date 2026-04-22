import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: 'var(--color-1)',
      light: 'var(--color-2)',
      dark: 'var(--color-3)',
      contrastText: 'var(--color-5)',
    },
    secondary: {
      main: 'var(--color-6)',
      light: 'var(--color-5)',
      dark: 'var(--color-4)',
    },
    error: {
      main: 'var(--red-600)',
      dark: 'var(--red-800)',
      light: 'var(--red-900)',
    },
    background: {
      default: 'var(--surface-1)',
      paper: 'var(--surface-0)',
    },
    text: {
      primary: 'var(--ink-strong)',
      secondary: 'var(--ink-soft)',
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
