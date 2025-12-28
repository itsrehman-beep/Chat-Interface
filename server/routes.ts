import type { Express } from "express";
import { createServer, type Server } from "http";

const WEBHOOK_URL =
  "https://n8n.dev01.modelmatrix.ai/webhook/d87c25a6-5ebe-4dbe-9f94-504eab7aa23b";

const AVAILABLE_MODELS = [
  "meta-llama/llama-3.1-8b-instruct",
  "meta-llama/llama-3.3-70b-instruct",
  "qwen/qwen3-32b",
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-oss-120b",
  "z-ai/glm-4.6",
];

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.get("/api/models", async (req, res) => {
    res.json({
      data: AVAILABLE_MODELS.map((id) => ({ id })),
    });
  });

  app.post("/api/webhook", async (req, res) => {
    try {
      const { first_message, session_id, model, current_agent, conversation } = req.body;

      if (!session_id || !model) {
        return res.status(400).json({
          error: "Missing required fields: session_id and model",
        });
      }

      let webhookPayload;
      
      if (first_message !== null && first_message !== undefined) {
        webhookPayload = {
          first_message,
          session_id,
          model,
        };
      } else {
        if (!current_agent || !conversation) {
          return res.status(400).json({
            error: "Follow-up messages require current_agent and conversation",
          });
        }
        webhookPayload = {
          first_message: null,
          current_agent,
          session_id,
          model,
          conversation,
        };
      }

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Webhook error:", errorText);
        return res.status(response.status).json({
          error: "Webhook request failed",
          details: errorText,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error calling webhook:", error);
      res.status(500).json({
        error: "Failed to call webhook",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return httpServer;
}
