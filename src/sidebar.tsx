import {
  Box,
  Circle,
  Flex,
  HStack,
  IconButton,
  Link,
  Stack,
  Text,
  Spinner,
} from '@chakra-ui/react';
import { Tooltip } from './components/ui/tooltip';
import {
  NewChatIcon,
  SidebarIcon,
  SmallGPTIcon,
  UpgradeIcon,
} from './icons/sidebar-icons';

import { useSidebarContext } from './sidebar-context';
import { useChat } from './contexts/ChatContext';
import { useAuth } from './contexts/AuthContext';
import { useState } from 'react';

// Chat history item component
function ChatHistoryItem({ title, chatId: _, selected, onClick }: { 
  title: string; 
  chatId: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Link 
      href="#" 
      variant="plain" 
      _hover={{ 
        bg: 'whiteAlpha.100',
        textDecor: 'none' 
      }}
      display="block"
      px="3"
      py="2"
      borderRadius="md"
      fontSize="sm"
      color="whiteAlpha.900"
      minW="230px"
      bg={selected ? 'whiteAlpha.200' : 'transparent'}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {title}
    </Link>
  );
}

// Section title component
function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <Text 
      fontSize="sm" 
      fontWeight="medium" 
      color="whiteAlpha.600" 
      px="3" 
      py="2"
      minW="230px"
    >
      {title} {count !== undefined && `(${count})`}
    </Text>
  );
}

export function Sidebar() {
  const { sideBarVisible, toggleSidebar } = useSidebarContext();
  const { isAuthenticated, logout } = useAuth();
  const { 
    chats, 
    currentChat, 
    isLoading, 
    selectChat, 
    clearCurrentChat 
  } = useChat();
  const [newChatLoading, setNewChatLoading] = useState(false);

  // Get today's chats
  const todayChats = chats.filter(chat => {
    const chatDate = new Date(chat.updatedAt);
    const today = new Date();
    return (
      chatDate.getDate() === today.getDate() &&
      chatDate.getMonth() === today.getMonth() &&
      chatDate.getFullYear() === today.getFullYear()
    );
  });

  // Get yesterday's chats
  const yesterdayChats = chats.filter(chat => {
    const chatDate = new Date(chat.updatedAt);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      chatDate.getDate() === yesterday.getDate() &&
      chatDate.getMonth() === yesterday.getMonth() &&
      chatDate.getFullYear() === yesterday.getFullYear()
    );
  });

  // Get chats from previous 7 days (excluding today and yesterday)
  const previousChats = chats.filter(chat => {
    const chatDate = new Date(chat.updatedAt);
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Exclude today and yesterday
    const isToday = (
      chatDate.getDate() === today.getDate() &&
      chatDate.getMonth() === today.getMonth() &&
      chatDate.getFullYear() === today.getFullYear()
    );
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = (
      chatDate.getDate() === yesterday.getDate() &&
      chatDate.getMonth() === yesterday.getMonth() &&
      chatDate.getFullYear() === yesterday.getFullYear()
    );
    
    return !isToday && !isYesterday && chatDate >= weekAgo;
  });

  // Handle creating a new chat
  const handleNewChat = async () => {
    if (newChatLoading) return;
    
    setNewChatLoading(true);
    clearCurrentChat();
    setNewChatLoading(false);
  };

  return (
    <Box
      bg='#000000'
      w={!sideBarVisible ? '0' : '260px'}
      minW={!sideBarVisible ? '0' : '260px'}
      overflow='hidden'
      transition='all 0.3s'
      h='100vh'
      color='white'
      position="relative"
    >
      <Stack 
        h='full' 
        py='2' 
        gap="1" 
        width="260px" 
        style={{ 
          opacity: !sideBarVisible ? 0 : 1,
          transition: 'opacity 0.3s' 
        }}
      >
        <Flex justify='space-between' px='3' mb="2">
          <Tooltip
            content='Close sidebar'
            positioning={{ placement: 'right' }}
            showArrow
          >
            <IconButton variant='ghost' onClick={toggleSidebar} color="whiteAlpha.700">
              <SidebarIcon fontSize='2xl' />
            </IconButton>
          </Tooltip>

          <Tooltip content='New chat' showArrow>
            <IconButton 
              variant='ghost' 
              color="whiteAlpha.700"
              onClick={handleNewChat}
              disabled={newChatLoading}
            >
              {newChatLoading ? (
                <Spinner size="sm" color="whiteAlpha.700" />
              ) : (
                <NewChatIcon fontSize='2xl' />
              )}
            </IconButton>
          </Tooltip>
        </Flex>

        <Stack px='2' gap='0' flex='1' overflowY="auto">
          {/* ChatGPT */}
          <HStack
            position='relative'
            className='group'
            _hover={{
              bg: 'whiteAlpha.100',
              textDecor: 'none',
            }}
            px='3'
            py='2'
            borderRadius='md'
            w='100%'
            whiteSpace='nowrap'
            minW="230px"
            onClick={handleNewChat}
            cursor="pointer"
          >
            <Circle size='6' bg='gray.700'>
              <SmallGPTIcon fontSize='md' />
            </Circle>
            <Text fontSize='sm' fontWeight='medium' color="white">
              New Chat
            </Text>
          </HStack>

          {isLoading ? (
            <Flex justify="center" py="4">
              <Spinner color="whiteAlpha.700" />
            </Flex>
          ) : (
            <>
              {/* Today's Chats */}
              {todayChats.length > 0 && (
                <>
                  <SectionTitle title="Today" count={todayChats.length} />
                  {todayChats.map(chat => (
                    <ChatHistoryItem
                      key={chat._id}
                      title={chat.title}
                      chatId={chat._id}
                      selected={currentChat?._id === chat._id}
                      onClick={() => selectChat(chat._id)}
                    />
                  ))}
                </>
              )}
              
              {/* Yesterday's Chats */}
              {yesterdayChats.length > 0 && (
                <>
                  <SectionTitle title="Yesterday" count={yesterdayChats.length} />
                  {yesterdayChats.map(chat => (
                    <ChatHistoryItem
                      key={chat._id}
                      title={chat.title}
                      chatId={chat._id}
                      selected={currentChat?._id === chat._id}
                      onClick={() => selectChat(chat._id)}
                    />
                  ))}
                </>
              )}
              
              {/* Previous 7 Days */}
              {previousChats.length > 0 && (
                <>
                  <SectionTitle title="Previous 7 Days" count={previousChats.length} />
                  {previousChats.map(chat => (
                    <ChatHistoryItem
                      key={chat._id}
                      title={chat.title}
                      chatId={chat._id}
                      selected={currentChat?._id === chat._id}
                      onClick={() => selectChat(chat._id)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </Stack>

        {isAuthenticated ? (
          <Link
            onClick={() => logout()}
            href="#"
            _hover={{ textDecor: 'none', bg: 'whiteAlpha.100' }}
            borderRadius='md'
            px='3'
            py='2'
            mx="2"
            minW="230px"
          >
            <HStack whiteSpace='nowrap'>
              <Circle size='8' fontSize='lg' bg="transparent" borderWidth='1px' borderColor="whiteAlpha.400">
                <Box as="span">🚪</Box>
              </Circle>
              <Stack gap='0' fontWeight='medium'>
                <Text fontSize='sm' color="white">Log out</Text>
              </Stack>
            </HStack>
          </Link>
        ) : (
          <Link
            href='#'
            _hover={{ textDecor: 'none', bg: 'whiteAlpha.100' }}
            borderRadius='md'
            px='3'
            py='2'
            mx="2"
            minW="230px"
          >
            <HStack whiteSpace='nowrap'>
              <Circle size='8' fontSize='lg' bg="transparent" borderWidth='1px' borderColor="whiteAlpha.400">
                <UpgradeIcon color="white" />
              </Circle>
              <Stack gap='0' fontWeight='medium'>
                <Text fontSize='sm' color="white">Upgrade plan</Text>
                <Text fontSize='xs' color='whiteAlpha.600'>
                  More access to the best models
                </Text>
              </Stack>
            </HStack>
          </Link>
        )}
      </Stack>
    </Box>
  );
}
