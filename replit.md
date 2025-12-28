# Cerebras Chat Interface

## Overview
A React-based chat interface for interacting with Cerebras/OpenRouter AI models via an n8n webhook. Users can select a model, send messages, and inspect detailed responses including intent analysis and runtime prompts.

## Current State
- **Status**: MVP Complete
- **Last Updated**: December 2025

## Features
- **Model Selector**: Static dropdown with 6 available models (meta-llama, qwen, openai, z-ai)
- **Chat Interface**: Real-time messaging with user/assistant message rendering
  - Strips `<think>` tags from AI responses automatically
  - Renders `**bold**` markdown as bold text
- **Tool Response Display**: Smart type-based formatting for different response types:
  - Transactions: Shows credit/debit with colors, formatted currency, icons
  - Account Balances: Displays with currency formatting and account info
  - Paginated Responses: Shows pagination badges and renders items appropriately
  - Bills: Displays biller info, amount, due date, status
  - Exchange Rates: Shows currency pair and rate
  - Generic: Fallback with smart key ordering
- **Side Pane Inspector**: Expandable sections for Intent Analyzer and Runtime Prompt responses
- **Theme Toggle**: Light/dark mode with consistent typography across themes
- **Responsive Design**: Side pane stacks on mobile devices
- **Multi-turn Conversations**: Tracks current agent and builds conversation history

## Architecture

### Frontend (React + Vite)
- `client/src/pages/chat.tsx` - Main chat page with all state management
- `client/src/components/` - Reusable UI components:
  - `model-selector.tsx` - Model dropdown selector
  - `chat-message.tsx` - Individual message rendering with tool responses
  - `message-input.tsx` - Auto-expanding textarea with send button
  - `side-pane.tsx` - Inspector panel with collapsible sections
  - `theme-toggle.tsx` - Dark/light mode toggle
  - `loading-overlay.tsx` - Full-screen loading indicator
  - `error-banner.tsx` - Dismissible error notification
  - `empty-state.tsx` - Placeholder when no messages

### Backend (Express)
- `server/routes.ts` - API endpoints:
  - `GET /api/models` - Returns static list of available models
  - `POST /api/webhook` - Proxies messages to n8n webhook

### Shared
- `shared/schema.ts` - TypeScript types and Zod schemas for ChatMessage, WebhookRequest, etc.

## Available Models
1. meta-llama/llama-3.1-8b-instruct
2. meta-llama/llama-3.3-70b-instruct
3. qwen/qwen3-32b
4. qwen/qwen3-235b-a22b-2507
5. openai/gpt-oss-120b
6. z-ai/glm-4.6

## Webhook Integration
- **URL**: https://n8n.dev01.modelmatrix.ai/webhook/d87c25a6-5ebe-4dbe-9f94-504eab7aa23b
- **Session ID**: Hardcoded to `c2c1dafa-273f-4c0f-bf5a-8ef8232a4cb5`
- **Method**: POST
- **First Message Body**: `{ first_message: string, session_id: string, model: string }`
- **Follow-up Body**: `{ first_message: null, current_agent: string, session_id: string, model: string, conversation: array }`
- **Response**: Array containing Tool_Call_Response, Intent_Analyzer_Response, Runtime_Prompt_Response

## Design System
- **Primary**: #6366F1 (Indigo)
- **Secondary**: #8B5CF6 (Purple)
- **Accent**: #10B981 (Green)
- **Typography**: Inter (sans), IBM Plex Mono (monospace)
- **Dark mode**: Full support with proper contrast

## Running the Application
```bash
npm run dev
```
Starts Express server on port 5000 with Vite dev server for frontend.

## Environment Variables
- `OPENROUTER_KEY` - API key for OpenRouter (used by n8n webhook)
