import { Box, Text, Flex } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../../contexts/ChatContext';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

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
          </Box>
        )}
      </Box>
    </Flex>
  );
}; 