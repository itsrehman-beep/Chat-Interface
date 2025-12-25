# Cerebras Chat Interface

## Overview
A React-based chat interface for interacting with Cerebras/OpenRouter AI models via an n8n webhook. Users can select a model, send messages, and inspect detailed responses including intent analysis and runtime prompts.

## Current State
- **Status**: MVP Complete
- **Last Updated**: December 2025

## Features
- **Model Selector**: Static dropdown with 6 available models (meta-llama, qwen, openai, z-ai)
- **Chat Interface**: Real-time messaging with user/assistant message rendering
- **Tool Response Display**: Flat key-value rendering with image URL thumbnail support
- **Side Pane Inspector**: Expandable sections for Intent Analyzer and Runtime Prompt responses
- **Theme Toggle**: Light/dark mode with localStorage persistence
- **Responsive Design**: Side pane stacks on mobile devices

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
- **URL**: https://n8n.dev01.modelmatrix.ai/webhook-test/86f31db0-921a-40d5-b6a7-6dc4ec542705
- **Method**: POST
- **Body**: `{ model_name: string, first_message: string }`
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
