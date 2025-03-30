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

// Stream AI response using Gemini
export const streamAIResponse = async (req, res) => {
  try {
    const { prompt, chatHistory = [] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    // Set up headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering if using Nginx
    
    // Format chat history for Gemini if provided
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    // Select Gemini model
    const model = geminiAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });
    
    try {
      let streamingResult;
      
      // Use chat for history or generateContent for single prompts
      if (formattedHistory.length > 0) {
        // Create a chat instance
        const chat = model.startChat({
          history: formattedHistory,
        });
        
        // Generate streaming response
        streamingResult = await chat.sendMessageStream(prompt);
      } else {
        // Generate streaming response for a single prompt
        streamingResult = await model.generateContentStream({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
      }
      
      // Process the stream
      for await (const chunk of streamingResult.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          // Send each chunk as an SSE message
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          // Flush the response to ensure immediate delivery
          res.flush?.();
        }
      }
      
      // End the stream when complete
      res.write(`event: end\ndata: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (streamError) {
      console.error('Streaming error:', streamError);
      res.write(`event: error\ndata: ${JSON.stringify({ error: streamError.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('AI stream setup error:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}; 