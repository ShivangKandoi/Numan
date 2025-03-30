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
  isStreaming?: boolean; // Flag to indicate if message is currently streaming
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
  createStreamingChat: (message: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  sendStreamingMessage: (message: string) => Promise<void>;
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

  // Create a new chat with streaming response
  const createStreamingChat = async (message: string) => {
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
      
      // Add an empty assistant message to start streaming into
      try {
        const assistantMsgResponse = await axios.post(
          `${API_URL}/chat/${newChat._id}/messages`, 
          { 
            role: 'assistant', 
            content: '' 
          }
        );
        
        const chatWithAssistantMsg = assistantMsgResponse.data;
        
        // Update state with the empty assistant message
        setCurrentChat(chatWithAssistantMsg);
        setChats(prevChats => [chatWithAssistantMsg, ...prevChats]);
        
        // Open SSE connection for streaming response
        const eventSource = new EventSource(`${API_URL}/ai/stream?token=${token}`, {
          withCredentials: true
        });
        
        let accumulatedText = '';
        
        // Handle incoming stream chunks
        eventSource.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.text) {
              accumulatedText += data.text;
              
              // Update the current chat state with accumulated text
              setCurrentChat(prevChat => {
                if (!prevChat) return null;
                
                const updatedMessages = [...prevChat.messages];
                // The last message should be the assistant message we're updating
                updatedMessages[updatedMessages.length - 1] = {
                  ...updatedMessages[updatedMessages.length - 1],
                  content: accumulatedText,
                  isStreaming: true
                };
                
                return { ...prevChat, messages: updatedMessages };
              });
              
              // Also update in the chats list
              setChats(prevChats => {
                return prevChats.map(chat => {
                  if (chat._id === newChat._id) {
                    const updatedMessages = [...chat.messages];
                    updatedMessages[updatedMessages.length - 1] = {
                      ...updatedMessages[updatedMessages.length - 1],
                      content: accumulatedText,
                      isStreaming: true
                    };
                    return { ...chat, messages: updatedMessages };
                  }
                  return chat;
                });
              });
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };
        
        // Handle the end of the stream
        eventSource.addEventListener('end', async () => {
          eventSource.close();
          
          try {
            // Update the message in the database with the final content
            await axios.put(
              `${API_URL}/chat/${newChat._id}/messages/${chatWithAssistantMsg.messages[chatWithAssistantMsg.messages.length - 1]._id}`,
              { content: accumulatedText || "I couldn't generate a response. Please try again." }
            );
            
            // Update local state to show streaming has finished
            setCurrentChat(prevChat => {
              if (!prevChat) return null;
              
              const updatedMessages = [...prevChat.messages];
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: accumulatedText || "I couldn't generate a response. Please try again.",
                isStreaming: false
              };
              
              return { ...prevChat, messages: updatedMessages };
            });
            
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat._id === newChat._id) {
                  const updatedMessages = [...chat.messages];
                  updatedMessages[updatedMessages.length - 1] = {
                    ...updatedMessages[updatedMessages.length - 1],
                    content: accumulatedText || "I couldn't generate a response. Please try again.",
                    isStreaming: false
                  };
                  return { ...chat, messages: updatedMessages };
                }
                return chat;
              });
            });
          } catch (error) {
            console.error('Error updating final message content:', error);
          }
          
          setIsLoading(false);
        });
        
        // Type for EventSource errors
        interface EventSourceError {
          type: string;
          message?: string;
          error?: any;
        }

        // Handle errors
        eventSource.onerror = (err: EventSourceError | Event) => {
          console.error('SSE error:', err);
          eventSource.close();
          
          // Update the message with error information
          const errorMsg = "Sorry, there was an error generating the response. Please try again.";
          
          try {
            axios.put(
              `${API_URL}/chat/${newChat._id}/messages/${chatWithAssistantMsg.messages[chatWithAssistantMsg.messages.length - 1]._id}`,
              { content: errorMsg }
            );
            
            // Update UI with error
            setCurrentChat(prevChat => {
              if (!prevChat) return null;
              
              const updatedMessages = [...prevChat.messages];
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: errorMsg,
                isStreaming: false
              };
              
              return { ...prevChat, messages: updatedMessages };
            });
            
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat._id === newChat._id) {
                  const updatedMessages = [...chat.messages];
                  updatedMessages[updatedMessages.length - 1] = {
                    ...updatedMessages[updatedMessages.length - 1],
                    content: errorMsg,
                    isStreaming: false
                  };
                  return { ...chat, messages: updatedMessages };
                }
                return chat;
              });
            });
          } catch (error) {
            console.error('Error updating message with error content:', error);
          }
          
          setIsLoading(false);
          setError('Error streaming response');
        };
        
        // Send the prompt to the streaming endpoint
        try {
          const streamResponse = await fetch(`${API_URL}/ai/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              prompt: message,
              chatHistory: []
            })
          });
          
          if (!streamResponse.ok) {
            // If streaming fails, try fallback to regular response
            console.warn('Streaming failed, falling back to regular response');
            eventSource.close();
            
            // Get regular AI response as fallback
            const aiResponse = await axios.post(`${API_URL}/ai/generate`, { 
              prompt: message,
              chatHistory: [] 
            });
            
            // Update message with non-streaming response
            await axios.put(
              `${API_URL}/chat/${newChat._id}/messages/${chatWithAssistantMsg.messages[chatWithAssistantMsg.messages.length - 1]._id}`,
              { content: aiResponse.data.response }
            );
            
            // Update UI with regular response
            setCurrentChat(prevChat => {
              if (!prevChat) return null;
              
              const updatedMessages = [...prevChat.messages];
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: aiResponse.data.response,
                isStreaming: false
              };
              
              return { ...prevChat, messages: updatedMessages };
            });
            
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat._id === newChat._id) {
                  const updatedMessages = [...chat.messages];
                  updatedMessages[updatedMessages.length - 1] = {
                    ...updatedMessages[updatedMessages.length - 1],
                    content: aiResponse.data.response,
                    isStreaming: false
                  };
                  return { ...chat, messages: updatedMessages };
                }
                return chat;
              });
            });
            
            setIsLoading(false);
          }
        } catch (streamErr) {
          console.error('Error initiating stream:', streamErr);
          eventSource.close();
          setIsLoading(false);
        }
      } catch (assistantMsgErr) {
        console.error('Error adding assistant message:', assistantMsgErr);
        
        // Fallback: try regular non-streaming response
        try {
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
        } catch (aiErr) {
          // Still set the chat even if AI response fails
          setCurrentChat(newChat);
          setChats(prevChats => [newChat, ...prevChats]);
          console.error('Fallback AI response also failed:', aiErr);
          setError('Failed to get AI response. Please try again.');
        }
        
        setIsLoading(false);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create streaming chat';
      console.error('Error creating streaming chat:', err);
      setError(errorMessage);
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

  // Send a message with streaming response
  const sendStreamingMessage = async (message: string) => {
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
      
      // Update chat with user message
      const chatWithUserMsg = updatedChatWithUserMsg.data;
      setCurrentChat(chatWithUserMsg);
      
      // Update chats list with user message
      setChats(prevChats => 
        prevChats.map(chat => 
          chat._id === currentChat._id ? chatWithUserMsg : chat
        )
      );
      
      try {
        // Add empty assistant message for streaming
        const assistantMsgResponse = await axios.post(
          `${API_URL}/chat/${currentChat._id}/messages`, 
          { 
            role: 'assistant', 
            content: '' 
          }
        );
        
        const chatWithAssistantMsg = assistantMsgResponse.data;
        
        // Update state with empty assistant message
        setCurrentChat(chatWithAssistantMsg);
        setChats(prevChats => 
          prevChats.map(chat => 
            chat._id === currentChat._id ? chatWithAssistantMsg : chat
          )
        );
        
        // Prepare chat history for AI
        const chatHistory = chatWithUserMsg.messages.map(
          (msg: Message) => ({
            role: msg.role,
            content: msg.content
          })
        );
        
        // Open SSE connection for streaming response
        const eventSource = new EventSource(`${API_URL}/ai/stream?token=${token}`, {
          withCredentials: true
        });
        
        let accumulatedText = '';
        
        // Handle incoming stream chunks
        eventSource.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.text) {
              accumulatedText += data.text;
              
              // Update current chat with accumulated text
              setCurrentChat(prevChat => {
                if (!prevChat) return null;
                
                const updatedMessages = [...prevChat.messages];
                // The last message should be the assistant message we're updating
                updatedMessages[updatedMessages.length - 1] = {
                  ...updatedMessages[updatedMessages.length - 1],
                  content: accumulatedText,
                  isStreaming: true
                };
                
                return { ...prevChat, messages: updatedMessages };
              });
              
              // Update in the chats list
              setChats(prevChats => {
                return prevChats.map(chat => {
                  if (chat._id === currentChat._id) {
                    const updatedMessages = [...chat.messages];
                    updatedMessages[updatedMessages.length - 1] = {
                      ...updatedMessages[updatedMessages.length - 1],
                      content: accumulatedText,
                      isStreaming: true
                    };
                    return { ...chat, messages: updatedMessages };
                  }
                  return chat;
                });
              });
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };
        
        // Handle the end of the stream
        eventSource.addEventListener('end', async () => {
          eventSource.close();
          
          try {
            // Update the message in the database with the final content
            await axios.put(
              `${API_URL}/chat/${currentChat._id}/messages/${chatWithAssistantMsg.messages[chatWithAssistantMsg.messages.length - 1]._id}`,
              { content: accumulatedText || "I couldn't generate a response. Please try again." }
            );
            
            // Update state to show streaming has finished
            setCurrentChat(prevChat => {
              if (!prevChat) return null;
              
              const updatedMessages = [...prevChat.messages];
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: accumulatedText || "I couldn't generate a response. Please try again.",
                isStreaming: false
              };
              
              return { ...prevChat, messages: updatedMessages };
            });
            
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat._id === currentChat._id) {
                  const updatedMessages = [...chat.messages];
                  updatedMessages[updatedMessages.length - 1] = {
                    ...updatedMessages[updatedMessages.length - 1],
                    content: accumulatedText || "I couldn't generate a response. Please try again.",
                    isStreaming: false
                  };
                  return { ...chat, messages: updatedMessages };
                }
                return chat;
              });
            });
          } catch (error) {
            console.error('Error updating final message content:', error);
          }
          
          setIsLoading(false);
        });
        
        // Type for EventSource errors
        interface EventSourceError {
          type: string;
          message?: string;
          error?: any;
        }

        // Handle errors
        eventSource.onerror = (err: EventSourceError | Event) => {
          console.error('SSE error:', err);
          eventSource.close();
          
          // Update the message with error information
          const errorMsg = "Sorry, there was an error generating the response. Please try again.";
          
          try {
            axios.put(
              `${API_URL}/chat/${currentChat._id}/messages/${chatWithAssistantMsg.messages[chatWithAssistantMsg.messages.length - 1]._id}`,
              { content: errorMsg }
            );
            
            // Update UI with error
            setCurrentChat(prevChat => {
              if (!prevChat) return null;
              
              const updatedMessages = [...prevChat.messages];
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: errorMsg,
                isStreaming: false
              };
              
              return { ...prevChat, messages: updatedMessages };
            });
            
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat._id === currentChat._id) {
                  const updatedMessages = [...chat.messages];
                  updatedMessages[updatedMessages.length - 1] = {
                    ...updatedMessages[updatedMessages.length - 1],
                    content: errorMsg,
                    isStreaming: false
                  };
                  return { ...chat, messages: updatedMessages };
                }
                return chat;
              });
            });
          } catch (error) {
            console.error('Error updating message with error content:', error);
          }
          
          setIsLoading(false);
          setError('Error streaming response');
        };
        
        // Send the prompt to the streaming endpoint
        try {
          const streamResponse = await fetch(`${API_URL}/ai/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              prompt: message,
              chatHistory: chatHistory.slice(0, -1) // Exclude the latest messages
            })
          });
          
          if (!streamResponse.ok) {
            // If streaming fails, try fallback to regular response
            console.warn('Streaming failed, falling back to regular response');
            eventSource.close();
            
            // Get regular AI response as fallback
            const aiResponse = await axios.post(`${API_URL}/ai/generate`, { 
              prompt: message,
              chatHistory: chatHistory.slice(0, -1)
            });
            
            // Update message with non-streaming response
            await axios.put(
              `${API_URL}/chat/${currentChat._id}/messages/${chatWithAssistantMsg.messages[chatWithAssistantMsg.messages.length - 1]._id}`,
              { content: aiResponse.data.response }
            );
            
            // Update UI with regular response
            setCurrentChat(prevChat => {
              if (!prevChat) return null;
              
              const updatedMessages = [...prevChat.messages];
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: aiResponse.data.response,
                isStreaming: false
              };
              
              return { ...prevChat, messages: updatedMessages };
            });
            
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat._id === currentChat._id) {
                  const updatedMessages = [...chat.messages];
                  updatedMessages[updatedMessages.length - 1] = {
                    ...updatedMessages[updatedMessages.length - 1],
                    content: aiResponse.data.response,
                    isStreaming: false
                  };
                  return { ...chat, messages: updatedMessages };
                }
                return chat;
              });
            });
            
            setIsLoading(false);
          }
        } catch (streamErr) {
          console.error('Error initiating stream:', streamErr);
          eventSource.close();
          setIsLoading(false);
        }
      } catch (assistantMsgErr) {
        console.error('Error adding assistant message:', assistantMsgErr);
        
        // Fallback: try regular non-streaming response
        try {
          // Prepare chat history for AI
          const chatHistory = chatWithUserMsg.messages.map(
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
        } catch (aiErr) {
          console.error('Fallback AI response also failed:', aiErr);
          setError('Failed to get AI response. Please try again.');
        }
        
        setIsLoading(false);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send streaming message';
      console.error('Error sending streaming message:', err);
      setError(errorMessage);
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
        createStreamingChat,
        sendMessage,
        sendStreamingMessage,
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