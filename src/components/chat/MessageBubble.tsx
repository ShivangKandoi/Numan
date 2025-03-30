import { Box, Text, Flex } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../../contexts/ChatContext';
import { useEffect, useState } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming === true;
  const [displayCursor, setDisplayCursor] = useState(true);

  // Blinking cursor effect when streaming
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setDisplayCursor(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <Flex
      align="start"
      justify={isUser ? 'flex-end' : 'flex-start'}
      my={4}
      px={4}
      w="100%"
    >
      <Box
        maxW={{ base: '80%', md: '70%' }}
        bg={isUser ? '#303030' : 'transparent'}
        color="white"
        p={isUser ? 4 : 0}
        borderRadius={isUser ? '2xl' : 'none'}
      >
        {isUser ? (
          <Text>{message.content}</Text>
        ) : (
          <Box className="prose dark:prose-invert" fontSize="md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
            {isStreaming && displayCursor && (
              <Box as="span" display="inline-block" ml="1" backgroundColor="blue.400" width="2px" height="16px" animation="blink 1s infinite" />
            )}
          </Box>
        )}
      </Box>
    </Flex>
  );
}; 