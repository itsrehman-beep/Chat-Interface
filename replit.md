# Cerebras Model Chat Interface

## Overview

A web application chat interface for interacting with Cerebras AI models. Users can select from available models, send messages, receive responses via an n8n webhook integration, and inspect detailed reasoning and metadata in a side pane. The application is built as a React frontend with a lightweight Express backend that proxies webhook requests.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, local React state for UI
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Design Pattern**: Component-based architecture with separation between UI components, pages, and hooks

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx for development, esbuild for production
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Key Endpoints**:
  - `GET /api/models` - Returns available Cerebras model list
  - `POST /api/webhook` - Proxies requests to external n8n webhook

### Data Flow
1. User selects a model from dropdown populated by `/api/models`
2. User sends a message which triggers POST to `/api/webhook`
3. Backend proxies request to n8n webhook URL
4. Response contains Tool_Call_Response, Intent_Analyzer_Response, and Runtime_Prompt_Response
5. Chat messages are stored in React state (no backend persistence)
6. Side pane displays detailed metadata from Intent Analyzer and Runtime Prompt responses

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Database Schema
- Drizzle ORM is configured with PostgreSQL but currently uses in-memory storage
- Schema defined in `shared/schema.ts` contains Zod validation schemas for:
  - Chat messages with role, text, timestamps, and optional tool responses
  - Cerebras model metadata
  - Webhook request/response structures
- User storage interface exists but chat persistence is not implemented

## External Dependencies

### Third-Party Services
- **n8n Webhook**: External workflow automation endpoint at `https://n8n.dev01.modelmatrix.ai/webhook-test/86f31db0-921a-40d5-b6a7-6dc4ec542705`
  - Receives `model_name` and `first_message` in POST body
  - Returns array with Tool_Call_Response, Intent_Analyzer_Response, Runtime_Prompt_Response

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database toolkit with schema in `shared/schema.ts`
- **Migrations**: Stored in `./migrations` directory, push with `npm run db:push`

### Key Libraries
- **UI**: Radix UI primitives, Lucide icons, class-variance-authority for variants
- **Forms**: React Hook Form with Zod resolver
- **Data Fetching**: TanStack React Query
- **Styling**: Tailwind CSS with custom design tokens defined in CSS variables