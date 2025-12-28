import { z } from "zod";

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  text: z.string(),
  timestamp: z.number(),
  toolResponse: z.any().optional(),
  intentAnalyzer: z.any().optional(),
  runtimePrompt: z.any().optional(),
  error: z.string().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const cerebrasModelSchema = z.object({
  id: z.string(),
  object: z.string().optional(),
  created: z.number().optional(),
  owned_by: z.string().optional(),
});

export type CerebrasModel = z.infer<typeof cerebrasModelSchema>;

export const webhookRequestSchema = z.object({
  model_name: z.string(),
  first_message: z.string(),
});

export type WebhookRequest = z.infer<typeof webhookRequestSchema>;

export const webhookResponseSchema = z.array(z.object({
  Tool_Call_Response: z.any().optional(),
  Intent_Analyzer_Response: z.any().optional(),
  Runtime_Prompt_Response: z.any().optional(),
}));

export type WebhookResponse = z.infer<typeof webhookResponseSchema>;

export const chatSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  modelId: z.string().nullable(),
  currentAgent: z.string().nullable(),
  messages: z.array(chatMessageSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type ChatSession = z.infer<typeof chatSessionSchema>;

export const webhookFirstMessageRequestSchema = z.object({
  first_message: z.string(),
  session_id: z.string(),
  model: z.string(),
});

export type WebhookFirstMessageRequest = z.infer<typeof webhookFirstMessageRequestSchema>;

export const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export type ConversationMessage = z.infer<typeof conversationMessageSchema>;

export const webhookFollowUpRequestSchema = z.object({
  first_message: z.null(),
  current_agent: z.string(),
  session_id: z.string(),
  model: z.string(),
  conversation: z.array(conversationMessageSchema),
});

export type WebhookFollowUpRequest = z.infer<typeof webhookFollowUpRequestSchema>;
