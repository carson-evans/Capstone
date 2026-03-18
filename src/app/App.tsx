import React from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { router } from './routes';

function AppShell() {
  const { theme } = useTheme();

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors theme={theme} />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

export default App;