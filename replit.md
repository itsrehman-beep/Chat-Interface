# Eval Harness

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
- **Batch Executor**: Run multiple test cases and evaluate results (accessible via flask icon in header)

## Architecture

### Frontend (React + Vite)
- `client/src/pages/chat.tsx` - Main chat page with all state management
- `client/src/pages/batch-executor.tsx` - Batch test case execution and evaluation
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
  - `POST /api/batch-executor` - Runs test cases via batch executor webhook
  - `POST /api/evaluator` - Evaluates test run results

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
- **Request body**: `{ first_message: null, current_agent: string, session_id: string, model: string, messages: array }`
- **Optional fields**: `intent_system_prompt`, `runtime_system_prompt` (only included if user customizes them)
- **Response**: Array containing Tool_Request_Response, Intent_Analyzer_Response (first message only), RunTime_Prompt_Response

## System Prompts
Users can customize system prompts before starting a conversation via the settings (gear) icon:
- **Intent System Prompt**: Controls how intent is analyzed
- **Runtime System Prompt**: Controls the runtime behavior
Prompts are stored per-session and only included in requests if modified from defaults.

## Widget Type Detection
The side pane inspector detects and displays widget types from assistant responses:
- Looks for `type` field containing "widget" (e.g., "bank_accounts_carousel_widget")
- Shows widget type as a badge with prop count
- Works with both direct objects and JSON-parsed content

## Response Parsing
The `RunTime_Prompt_Response` can be an array of multiple steps (multi-step tool chain):
- Each step may contain: `content`, `reasoning`, `reasoning_details`, `tool_calls`, `usage`
- Reasoning is extracted from:
  - `reasoning` field directly
  - `reasoning_details[].text` or `reasoning_details[].content`
  - `<think>` tags within `content` field
  - Content arrays with structured segments `{ text: "..." }`
- All reasoning steps are displayed prominently in the side pane inspector
- Tool calls and usage statistics are shown in collapsible sections

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

## Batch Executor
The Batch Executor page (`/batch`) allows running multiple test cases from a Google Sheet:
- **Google Sheet**: https://docs.google.com/spreadsheets/d/1GXhMptDgVeen6gqn3rhulLa-0wSwXFVwwEBfNWoxxXU
- **Sheet Name**: MTX_TESTCASES
- **Features**:
  - Browse and select test cases from the sheet
  - Run selected test cases via batch executor webhook
  - Evaluate results with scoring and pass/fail status
- **Webhooks**:
  - Batch Executor: `https://n8n.dev01.modelmatrix.ai/webhook-test/6e888300-dc95-4d5c-a51a-f10d8afa2ece`
  - Evaluator: `https://n8n.dev01.modelmatrix.ai/webhook/8bc54e6e-7340-4db7-826f-0fd6c8f0c1e0`

## Environment Variables
- `OPENROUTER_KEY` - API key for OpenRouter (used by n8n webhook)
