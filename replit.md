# Discord AI Emotional Chatbot

## Overview

This is an AI-powered Discord bot that provides conversational support with multiple emotional personas. The bot uses OpenAI's GPT models to interact with users in three distinct modes: helper, supporter, and adviser. Each mode has its own personality, tone, and system prompts tailored for different types of interactions. The bot maintains conversation memory and supports both English and Hinglish languages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Bot Framework
- **Discord.js v14**: Modern Discord API wrapper with full intent support for guild messages, direct messages, and message content
- **Event-driven architecture**: Uses Discord client events to handle user interactions
- **Partial support**: Enables DM channel handling for private conversations

### AI Integration
- **OpenAI API v4**: Integrated with GPT-5 model for natural language processing
- **Dynamic system prompts**: Each emotional state has customized system prompts for consistent personality
- **Context-aware responses**: Maintains conversation flow with appropriate tone and personality

### Emotional State System
- **Three distinct personas**:
  - **Helper**: Friendly and supportive (green theme)
  - **Supporter**: Encouraging and empathetic (blue theme)
  - **Adviser**: Wise and analytical (orange theme)
- **Personality consistency**: Each state has defined greeting messages, tones, and behavioral patterns
- **Visual distinction**: Color-coded embeds for different emotional states

### Memory Management
- **Conversation memory**: Map-based storage for maintaining context across interactions
- **User-specific contexts**: Separate memory spaces for individual users
- **Session persistence**: Maintains conversation history during bot uptime

### Bot Presence
- **Custom activity status**: Displays "Listening to conversations with humans" 
- **Online presence**: Maintains active status to show availability

### Language Support
- **Bilingual capability**: Designed to understand and respond in both English and Hinglish
- **Inclusive communication**: System prompts specifically mention support for both languages

## External Dependencies

### Core Services
- **OpenAI API**: GPT-5 model integration for natural language processing and conversation generation
- **Discord API**: Bot hosting and real-time message handling through Discord.js library

### Environment Configuration
- **dotenv**: Secure environment variable management for API keys and configuration
- **Environment variables required**:
  - `OPENAI_API_KEY`: OpenAI API authentication
  - `DISCORD_TOKEN`: Discord bot authentication (implied)

### Node.js Dependencies
- **discord.js**: Official Discord API wrapper with gateway intents and embed support
- **openai**: Official OpenAI API client library
- **dotenv**: Environment variable loading and management

### Development Environment
- **Node.js runtime**: Requires Node.js 16.11.0 or higher
- **npm package management**: Standard dependency resolution and installation