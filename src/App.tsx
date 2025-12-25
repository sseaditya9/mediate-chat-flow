import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import About from "./pages/About";
import HowTo from "./pages/HowTo";
import { Header } from "@/components/layout/Header";
import { GlobalControls } from "@/components/layout/GlobalControls";
import { ThemeProvider } from "@/components/theme-provider";
import { useFavicon } from "@/hooks/useFavicon";
import Dashboard from "./pages/Dashboard";
import ChatRoom from "./pages/ChatRoom";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const AppContent = () => {
  useFavicon();

  return (
    <>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Header />
        <GlobalControls />
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat/:conversationId" element={<ChatRoom />} />
          <Route path="/account" element={<Account />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-to" element={<HowTo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
