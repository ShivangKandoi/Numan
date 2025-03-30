import { Box, Flex, Center } from '@chakra-ui/react';
import { BottomSection } from './bottom-section';
import { MiddleSection } from './middle-section';
import { Sidebar } from './sidebar';
import { SidebarProvider } from './sidebar-context';
import { TopSection } from './top-section';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { useState } from 'react';

// Auth Wrapper component to handle authentication routing
function AuthWrapper() {
  const { isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (!isAuthenticated) {
    return (
      <Center minH='100dvh' bg="#212121" p={4}>
        {isLogin ? (
          <LoginForm onToggleForm={() => setIsLogin(false)} />
        ) : (
          <SignupForm onToggleForm={() => setIsLogin(true)} />
        )}
      </Center>
    );
  }

  return (
    <ChatProvider>
      <SidebarProvider>
        <Flex minH='100dvh' bg="#212121" overflow="hidden">
          <Sidebar />

          <Box flex='1' bg="#212121" display="flex" flexDirection="column" height="100vh" overflow="hidden">
            {/* Fixed top section */}
            <Box position="sticky" top={0} zIndex={10}>
              <TopSection />
            </Box>
            
            {/* Scrollable middle section */}
            <Box flex="1" overflow="hidden">
              <MiddleSection />
            </Box>
            
            {/* Fixed bottom section */}
            <Box position="sticky" bottom={0} zIndex={10}>
              <BottomSection />
            </Box>
          </Box>
        </Flex>
      </SidebarProvider>
    </ChatProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}

export default App;
