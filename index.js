const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, Partials } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');
const moment = require('moment-timezone');
const axios = require('axios');
require('dotenv').config();

// DON'T DELETE THIS COMMENT - Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro" - do not change this unless explicitly requested by the user
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Free APIs for real-time knowledge
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const NEWS_API_URL = 'https://newsapi.org/v2/everything';
const THE_NEWS_API_URL = 'https://api.thenewsapi.com/v1/news/top';


// Conversation memory system
const conversationMemory = new Map();

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

// Bot ready event
client.once('clientReady', () => {
    console.log(`✅ ${client.user.tag} is now online and ready!`);
    
    // Set bot status to online with custom activity
    client.user.setPresence({
        activities: [{ name: 'conversations with humans 🤖', type: ActivityType.Listening }],
        status: 'online',
    });
});

// Function to get current IST time
function getCurrentISTTime() {
    return moment().tz('Asia/Kolkata').format('MMMM Do YYYY, h:mm:ss a');
}

// Function to detect if query needs real-time information
function needsRealTimeInfo(message) {
    const keywords = [
        'current', 'today', 'latest', 'recent', 'news', 'weather', 'stock', 'price',
        'happening', 'what\'s', 'whats', 'updates', 'breaking', 'live', 'now',
        'score', 'match', 'election', 'covid', 'coronavirus', 'exchange rate',
        'cryptocurrency', 'bitcoin', 'ethereum', 'trending', '2025', '2024'
    ];
    
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword)) ||
           lowerMessage.includes('time in') ||
           lowerMessage.includes('what time');
}

// Function to get weather information (completely free, no API key)
async function getWeatherInfo(query) {
    try {
        // Default to Delhi coordinates if no location specified
        let lat = 28.6139;
        let lon = 77.2090;
        let locationName = "Delhi";
        
        // Try to extract location from query (basic parsing)
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('mumbai') || lowerQuery.includes('bombay')) {
            lat = 19.0760; lon = 72.8777; locationName = "Mumbai";
        } else if (lowerQuery.includes('bangalore') || lowerQuery.includes('bengaluru')) {
            lat = 12.9716; lon = 77.5946; locationName = "Bangalore";
        } else if (lowerQuery.includes('chennai')) {
            lat = 13.0827; lon = 80.2707; locationName = "Chennai";
        } else if (lowerQuery.includes('kolkata') || lowerQuery.includes('calcutta')) {
            lat = 22.5726; lon = 88.3639; locationName = "Kolkata";
        } else if (lowerQuery.includes('hyderabad')) {
            lat = 17.3850; lon = 78.4867; locationName = "Hyderabad";
        } else if (lowerQuery.includes('pune')) {
            lat = 18.5204; lon = 73.8567; locationName = "Pune";
        }
        
        const response = await axios.get(`${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Asia/Kolkata`);
        const weather = response.data.current_weather;
        
        return `Current weather in ${locationName} (IST ${getCurrentISTTime()}):\n` +
               `🌡️ Temperature: ${weather.temperature}°C\n` +
               `💨 Wind Speed: ${weather.windspeed} km/h\n` +
               `🧭 Wind Direction: ${weather.winddirection}°\n` +
               `Weather Code: ${weather.weathercode}`;
    } catch (error) {
        console.error('Weather API Error:', error.message);
        return "Sorry, I couldn't fetch weather information right now. Please try again later.";
    }
}

// Function to get news information (free with NewsAPI)
async function getNewsInfo(query) {
    try {
        if (!process.env.NEWS_API_KEY) {
            return "I need a NewsAPI key to provide current news. The current time is " + getCurrentISTTime() + ". Please ask about weather instead, or contact the administrator for news access.";
        }
        
        // Extract search terms from query
        let searchTerm = "India";
        if (query.toLowerCase().includes('sports')) searchTerm = "sports India";
        else if (query.toLowerCase().includes('tech')) searchTerm = "technology India";
        else if (query.toLowerCase().includes('business')) searchTerm = "business India";
        
        const response = await axios.get(NEWS_API_URL, {
            params: {
                q: searchTerm,
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: 3,
                apiKey: process.env.NEWS_API_KEY
            }
        });
        
        if (response.data.articles && response.data.articles.length > 0) {
            let newsText = `📰 Latest news (${getCurrentISTTime()}):\n\n`;
            response.data.articles.slice(0, 3).forEach((article, index) => {
                newsText += `${index + 1}. **${article.title}**\n${article.description || 'No description available'}\n\n`;
            });
            return newsText;
        } else {
            return "No recent news found. Current time: " + getCurrentISTTime();
        }
    } catch (error) {
        console.error('News API Error:', error.message);
        return "Sorry, I couldn't fetch news right now. Current time: " + getCurrentISTTime();
    }
}

// Function to get real-time information using free APIs
async function getRealTimeInfo(query) {
    const lowerQuery = query.toLowerCase();
    
    // If asking about weather
    if (lowerQuery.includes('weather') || lowerQuery.includes('temperature') || lowerQuery.includes('rain') || lowerQuery.includes('climate')) {
        return await getWeatherInfo(query);
    }
    
    // If asking about news
    if (lowerQuery.includes('news') || lowerQuery.includes('latest') || lowerQuery.includes('current events') || lowerQuery.includes('happening')) {
        return await getNewsInfo(query);
    }
    
    // If asking about time
    if (lowerQuery.includes('time') || lowerQuery.includes('clock')) {
        return `🕒 Current time in India (IST): ${getCurrentISTTime()}`;
    }
    
    // For other real-time queries, provide time and suggest available features
    return `Current time in India (IST): ${getCurrentISTTime()}\n\nI can provide real-time information about:\n• Weather (ask "what's the weather in Mumbai?")\n• Current time in IST\n• News (if NewsAPI key is available)\n\nFor other current information, please be more specific about weather or time!`;
}

// Function to get user's conversation context
function getUserContext(userId) {
    if (!conversationMemory.has(userId)) {
        conversationMemory.set(userId, {
            messages: [],
            preferences: {}
        });
    }
    return conversationMemory.get(userId);
}


// Function to generate AI response
async function generateAIResponse(userMessage, context) {
    try {
        // Prepare conversation history for context
        const recentMessages = context.messages.slice(-10); // Last 10 messages for context
        
        // Build conversation context for Gemini
        let conversationContext = "";
        if (recentMessages.length > 0) {
            conversationContext = "\n\nPrevious conversation context:\n";
            recentMessages.forEach(msg => {
                conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
            });
        }
        
        const currentTime = getCurrentISTTime();
        const prompt = `You are a helpful, intelligent AI assistant. Be warm, friendly, and conversational.
        
Current time in India (IST): ${currentTime}
                
Important guidelines:
                - You understand both English and Hinglish (Hindi mixed with English)
                - Be logical and think step by step when solving problems
                - Keep responses conversational and engaging
                - If someone writes in Hinglish, you can respond in Hinglish too
                - Be emotionally intelligent and adapt to the user's mood
                - Remember previous conversation context when relevant
                - Provide helpful, accurate, and thoughtful responses
                - When discussing time, always use IST (Indian Standard Time)
                - If asked about current events or real-time information, mention that you may not have the latest updates
                ${conversationContext}
                
User: ${userMessage}
Assistant:`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // DON'T DELETE THIS COMMENT - Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro" - do not change this unless explicitly requested by the user
            contents: prompt,
        });

        return response.text || "Sorry, I'm having trouble processing that right now. Please try again! 😅";
    } catch (error) {
        console.error('Gemini API Error:', error);
        return "Sorry, I'm having trouble processing that right now. Please try again! 😅";
    }
}

// Message handler
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Only respond to mentions or DMs
    if (!message.mentions.has(client.user) && message.guild) return;
    
    const userId = message.author.id;
    const userContext = getUserContext(userId);
    
    try {
        // Show typing indicator
        await message.channel.sendTyping();
        
        // Clean message content (remove all bot mentions)
        let cleanMessage = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
        
        let aiResponse;
        
        // Check if user is asking for real-time information
        if (needsRealTimeInfo(cleanMessage)) {
            console.log('🔍 Using real-time knowledge for:', cleanMessage);
            aiResponse = await getRealTimeInfo(cleanMessage);
        } else {
            // Use regular Gemini for general conversation
            aiResponse = await generateAIResponse(cleanMessage, userContext);
        }
        
        // Save conversation to memory
        userContext.messages.push(
            { role: "user", content: cleanMessage },
            { role: "assistant", content: aiResponse }
        );
        
        // Keep only recent messages in memory (last 20 exchanges)
        if (userContext.messages.length > 40) {
            userContext.messages = userContext.messages.slice(-40);
        }
        
        // Send simple text response
        await message.reply(aiResponse);
        
    } catch (error) {
        console.error('Error processing message:', error);
        await message.reply("Sorry, I encountered an error. Please try again! 😔");
    }
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login to Discord
if (process.env.DISCORD_BOT_TOKEN) {
    client.login(process.env.DISCORD_BOT_TOKEN);
} else {
    console.error('❌ DISCORD_BOT_TOKEN is not set in environment variables!');
    console.log('Please set your Discord bot token in the secrets.');
}