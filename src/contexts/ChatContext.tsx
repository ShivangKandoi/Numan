import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface Chat {
  _id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  fetchChats: () => Promise<void>;
  createChat: (message: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  clearCurrentChat: () => void;
}

// Create the chat context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Configure axios with authentication
const configureAxios = (token: string | null) => {
  axios.defaults.baseURL = API_URL;
  
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Provider component
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, token } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configure axios when token changes
  useEffect(() => {
    configureAxios(token);
  }, [token]);

  // Fetch all chats for the user
  const fetchChats = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/chat`);
      setChats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch chats');
      console.error('Error fetching chats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch chats on authentication change
  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    } else {
      setChats([]);
      setCurrentChat(null);
    }
  }, [isAuthenticated]);

  // Create a new chat
  const createChat = async (message: string) => {
    if (!isAuthenticated) {
      setError('You must be logged in to create a chat');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create chat with first user message
      const chatResponse = await axios.post(`${API_URL}/chat`, { message });
      const newChat = chatResponse.data;
      
      try {
        // Get AI response
        const aiResponse = await axios.post(`${API_URL}/ai/generate`, { 
          prompt: message,
          chatHistory: [] 
        });
        
        // Add AI response to chat
        const updatedChatResponse = await axios.post(
          `${API_URL}/chat/${newChat._id}/messages`, 
          { 
            role: 'assistant', 
            content: aiResponse.data.response 
          }
        );
        
        // Update state
        setCurrentChat(updatedChatResponse.data);
        setChats(prevChats => [updatedChatResponse.data, ...prevChats]);
      } catch (aiErr: any) {
        // Still set the chat even if AI response fails
        setCurrentChat(newChat);
        setChats(prevChats => [newChat, ...prevChats]);
        console.error('Error getting AI response:', aiErr);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create chat');
      console.error('Error creating chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message in the current chat
  const sendMessage = async (message: string) => {
    if (!currentChat || !isAuthenticated) {
      setError('No active chat or not logged in');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Add user message to current chat
      const updatedChatWithUserMsg = await axios.post(
        `${API_URL}/chat/${currentChat._id}/messages`, 
        { 
          role: 'user', 
          content: message 
        }
      );
      
      // Update current chat with user message
      setCurrentChat(updatedChatWithUserMsg.data);
      
      try {
        // Prepare chat history for AI
        const chatHistory = updatedChatWithUserMsg.data.messages.map(
          (msg: Message) => ({
            role: msg.role,
            content: msg.content
          })
        );
        
        // Get AI response
        const aiResponse = await axios.post(`${API_URL}/ai/generate`, { 
          prompt: message,
          chatHistory: chatHistory.slice(0, -1) // Exclude the latest user message
        });
        
        // Add AI response to chat
        const updatedChatWithAIResponse = await axios.post(
          `${API_URL}/chat/${currentChat._id}/messages`, 
          { 
            role: 'assistant', 
            content: aiResponse.data.response 
          }
        );
        
        // Update state
        setCurrentChat(updatedChatWithAIResponse.data);
        setChats(prevChats => 
          prevChats.map(chat => 
            chat._id === currentChat._id ? updatedChatWithAIResponse.data : chat
          )
        );
      } catch (aiErr: any) {
        // Update chats list even if AI response fails
        setChats(prevChats => 
          prevChats.map(chat => 
            chat._id === currentChat._id ? updatedChatWithUserMsg.data : chat
          )
        );
        console.error('Error getting AI response:', aiErr);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Select a chat by ID
  const selectChat = async (chatId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/chat/${chatId}`);
      setCurrentChat(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to select chat');
      console.error('Error selecting chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a chat
  const deleteChat = async (chatId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${API_URL}/chat/${chatId}`);
      
      // Update state
      setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
      
      // Clear current chat if deleted
      if (currentChat && currentChat._id === chatId) {
        setCurrentChat(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete chat');
      console.error('Error deleting chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear current chat
  const clearCurrentChat = () => {
    setCurrentChat(null);
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        isLoading,
        error,
        fetchChats,
        createChat,
        sendMessage,
        selectChat,
        deleteChat,
        clearCurrentChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 