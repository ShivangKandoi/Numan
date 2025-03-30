import Chat from '../models/Chat.js';

// Get all chats for a user
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ 
      userId: req.user.id 
    }).sort({ updatedAt: -1 });
    
    res.status(200).json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error while fetching chats' });
  }
};

// Get a single chat by ID
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({ 
      _id: req.params.chatId,
      userId: req.user.id
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.status(200).json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error while fetching chat' });
  }
};

// Create a new chat
export const createChat = async (req, res) => {
  try {
    const { message } = req.body;
    
    // Create a new chat with the first message
    const newChat = new Chat({
      userId: req.user.id,
      title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
      messages: [{
        role: 'user',
        content: message
      }]
    });
    
    const savedChat = await newChat.save();
    res.status(201).json(savedChat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error while creating chat' });
  }
};

// Add a message to an existing chat
export const addMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { role, content } = req.body;
    
    // Find chat and ensure it belongs to the user
    const chat = await Chat.findOne({ 
      _id: chatId,
      userId: req.user.id
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Add the new message
    chat.messages.push({
      role,
      content
    });
    
    // Update the chat title if it's the first few messages
    if (chat.messages.length <= 2 && role === 'user') {
      chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
    }
    
    const updatedChat = await chat.save();
    res.status(200).json(updatedChat);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Server error while adding message' });
  }
};

// Delete a chat
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const result = await Chat.findOneAndDelete({
      _id: chatId,
      userId: req.user.id
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error while deleting chat' });
  }
};

// Update chat title
export const updateChatTitle = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    
    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: req.user.id },
      { title },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.status(200).json(chat);
  } catch (error) {
    console.error('Update chat title error:', error);
    res.status(500).json({ message: 'Server error while updating chat title' });
  }
}; 