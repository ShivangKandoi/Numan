import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Gemini AI
const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate AI response using Gemini
export const generateResponse = async (req, res) => {
  try {
    const { prompt, chatHistory = [] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    // Format chat history for Gemini if provided
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    // Select Gemini model
    const model = geminiAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });
    
    let response;
    
    // Use chat for history or generateContent for single prompts
    if (formattedHistory.length > 0) {
      // Create a chat instance
      const chat = model.startChat({
        history: formattedHistory,
      });
      
      // Generate response
      response = await chat.sendMessage(prompt);
    } else {
      // Generate response for a single prompt
      response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
    }
    
    // Extract the response text
    const responseText = response.response.text();
    
    res.status(200).json({ 
      response: responseText
    });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ 
      message: 'Error generating AI response',
      error: error.message 
    });
  }
}; 