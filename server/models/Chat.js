import mongoose from 'mongoose';

// Message schema for individual messages within a chat
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    required: true,
    // Allow empty strings for streaming functionality
    validate: {
      validator: function(v) {
        return v !== undefined && v !== null;
      },
      message: props => `Content cannot be null or undefined`
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Chat schema to store entire conversation threads
const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat; 