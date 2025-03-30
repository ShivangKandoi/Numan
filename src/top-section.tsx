import { Flex, IconButton } from '@chakra-ui/react';
import { ChatGPTMenu } from './ChatGPTMenu';
import { Avatar } from './components/ui/avatar';
import { Tooltip } from './components/ui/tooltip';
import { NewChatIcon, SidebarIcon } from './icons/sidebar-icons';
import { useSidebarContext } from './sidebar-context';
import { useChat } from './contexts/ChatContext';

export function TopSection() {
  const { sideBarVisible, toggleSidebar } = useSidebarContext();
  const { clearCurrentChat } = useChat();
  
  const handleNewChat = () => {
    clearCurrentChat();
  };
  
  return (
    <Flex justify='space-between' align='center' p='2' bg="#212121" color="white">
      {!sideBarVisible && (
        <Flex>
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
            <IconButton variant='ghost' onClick={handleNewChat} color="whiteAlpha.700">
              <NewChatIcon fontSize='2xl' />
            </IconButton>
          </Tooltip>
          <ChatGPTMenu />
        </Flex>
      )}
      {sideBarVisible && <ChatGPTMenu />}

      <Avatar
        name='Esther'
        size='sm'
        colorPalette='teal'
        variant='solid'
        mr='3'
      />
    </Flex>
  );
}
