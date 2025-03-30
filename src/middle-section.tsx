import {
  Box,
  Center,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  VStack,
  Button as ChakraButton,
  Spinner,
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { useChat } from './contexts/ChatContext';
import { MessageBubble } from './components/chat/MessageBubble';

// SVG Icons
const AddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.44 4 16.08 4 12C4 11.38 4.08 10.79 4.21 10.21L9 15V16C9 17.1 9.9 18 11 18V19.93ZM17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 6.1 15 5V4.59C17.93 5.78 20 8.65 20 12C20 14.08 19.2 15.97 17.9 17.39Z" fill="currentColor"/>
  </svg>
);

const LightbulbIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C15.3137 2 18 4.68629 18 8C18 10.5912 16.4131 12.7897 14.1385 13.5839L14 13.618V16H10V13.618C7.75 12.825 6 10.625 6 8C6 4.68629 8.68629 2 12 2ZM12 20C10.3431 20 9 18.6569 9 17H15C15 18.6569 13.6569 20 12 20Z" fill="currentColor"/>
  </svg>
);

const ThreeDotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 12C6 13.1046 5.10457 14 4 14C2.89543 14 2 13.1046 2 12C2 10.8954 2.89543 10 4 10C5.10457 10 6 10.8954 6 12Z" fill="currentColor"/>
    <path d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z" fill="currentColor"/>
    <path d="M22 12C22 13.1046 21.1046 14 20 14C18.8954 14 18 13.1046 18 12C18 10.8954 18.8954 10 20 10C21.1046 10 22 10.8954 22 12Z" fill="currentColor"/>
  </svg>
);

const MicrophoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.91 11C17.91 13.8 15.7 16.1 12.9 16.1C10.1 16.1 7.89 13.8 7.89 11H5.98C5.98 14 8.28 16.5 11.38 16.9V20H14.4V16.9C17.5 16.5 19.8 14 19.8 11H17.91Z" fill="currentColor"/>
  </svg>
);

const WaveformIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12H4V21H2V12ZM6 7H8V21H6V7ZM10 10H12V21H10V10ZM14 2H16V21H14V2ZM18 4H20V21H18V4Z" fill="currentColor"/>
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L4 12H9V20H15V12H20L12 4Z" fill="currentColor"/>
  </svg>
);

export function MiddleSection() {
  const [inputValue, setInputValue] = useState('');
  const { currentChat, isLoading, sendMessage, createChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;
    
    const message = inputValue;
    setInputValue('');
    
    if (currentChat) {
      await sendMessage(message);
    } else {
      await createChat(message);
    }
    
    // Focus the input after sending
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChat?.messages]);

  // Input box component to avoid duplication
  const InputBox = () => (
    <Box 
      width="100%" 
      bg="#303030" 
      borderRadius="4xl" 
      p="3"
      pb="2"
    >
      <Box position="relative">
        <Input
          ref={inputRef}
          placeholder="Ask anything"
          variant="flushed"
          size="lg"
          color="white"
          _placeholder={{ color: 'whiteAlpha.600' }}
          value={inputValue}
          onChange={handleInputValue}
          onKeyDown={handleKeyDown}
          py="2"
          px="3"
          borderWidth="0 !important"
          outline="none !important"
          boxShadow="none !important"
          _focus={{
            borderWidth: "0 !important",
            boxShadow: "none !important"
          }}
          style={{ caretColor: 'white' }}
          w="100%"
          borderRadius="lg"
          disabled={isLoading}
          autoFocus
        />
      </Box>
      
      {/* Bottom Icons Row */}
      <Flex mt="2" justifyContent="space-between" alignItems="center">
        <HStack gap="2" ml="1">
          <IconButton
            aria-label="Add"
            variant="ghost"
            size="sm"
            borderRadius="full"
            color="whiteAlpha.700"
            minW="auto"
            h="auto"
            p="2"
          >
            <AddIcon />
          </IconButton>
          
          <ChakraButton
            variant="ghost"
            size="sm"
            borderRadius="full"
            fontSize="sm"
            color="whiteAlpha.700"
            fontWeight="medium"
            px="3"
            py="1"
          >
            <Box as="span" mr="2" display="inline-flex">
              <GlobeIcon />
            </Box>
            Search
          </ChakraButton>
          
          <ChakraButton
            variant="ghost"
            size="sm"
            borderRadius="full"
            fontSize="sm"
            color="whiteAlpha.700"
            fontWeight="medium"
            px="3"
            py="1"
          >
            <Box as="span" mr="2" display="inline-flex">
              <LightbulbIcon />
            </Box>
            Reason
          </ChakraButton>
          
          <IconButton
            aria-label="More options"
            variant="ghost"
            size="sm"
            borderRadius="full"
            color="whiteAlpha.700"
            minW="auto"
            h="auto"
            p="2"
          >
            <ThreeDotsIcon />
          </IconButton>
        </HStack>
        
        <HStack gap="2" mr="1">
          <IconButton
            aria-label="Voice input"
            variant="ghost"
            size="sm"
            borderRadius="full"
            color="whiteAlpha.700"
            minW="auto"
            h="auto"
            p="2"
          >
            <MicrophoneIcon />
          </IconButton>
          {inputValue ? (
            <Box
              as="button"
              aria-label="Send message"
              bg="white"
              color="#212121"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              p="2"
              minW="32px"
              minH="32px"
              onClick={handleSendMessage}
            >
              <ArrowUpIcon />
            </Box>
          ) : (
            <Box
              as="button"
              aria-label="Audio playback"
              bg="white"
              color="#212121"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              p="2"
              minW="32px"
              minH="32px"
            >
              <WaveformIcon />
            </Box>
          )}
        </HStack>
      </Flex>
    </Box>
  );
  
  return (
    <Box 
      position="relative" 
      flex="1" 
      bg="#212121" 
      color="white" 
      display="flex" 
      flexDirection="column"
      height="100%"
    >
      {currentChat ? (
        // Chat is active - display messages and input at bottom
        <Flex 
          direction="column" 
          w="100%" 
          h="100%" 
          maxW="850px" 
          margin="0 auto"
          position="relative"
        >
          {/* Scrollable chat messages */}
          <Box 
            flex="1" 
            overflowY="auto" 
            py={4} 
            px={4}
            mb={2}
            maxHeight="calc(100vh - 200px)" // Reserve space for header, input, bottom section
          >
            {currentChat.messages.map((message, index) => (
              <MessageBubble 
                key={`${message.role}-${index}`} 
                message={message} 
              />
            ))}
            <div ref={messagesEndRef} />
            {isLoading && (
              <Flex justify="center" my={4}>
                <Spinner color="blue.400" size="md" />
              </Flex>
            )}
          </Box>
          
          {/* Fixed input at bottom */}
          <Box 
            width="100%" 
            position="sticky" 
            bottom={0} 
            bg="#212121" 
            pt={2} 
            pb={4}
            zIndex={10}
            maxW="850px"
            mx="auto"
          >
            <InputBox />
          </Box>
        </Flex>
      ) : (
        // No active chat - center everything
        <Center h="100%">
          <VStack gap={6} w="100%" maxW="850px" px={4}>
            <Heading size='3xl' color='white'>What can I help with?</Heading>
            
            {/* Centered input area */}
            <Box maxW="650px" w="100%">
              <InputBox />
            </Box>
          </VStack>
        </Center>
      )}
    </Box>
  );
}
