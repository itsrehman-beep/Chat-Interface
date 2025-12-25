import type { Express } from "express";
import { createServer, type Server } from "http";

const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/models";
const WEBHOOK_URL = "https://n8n.dev01.modelmatrix.ai/webhook-test/86f31db0-921a-40d5-b6a7-6dc4ec542705";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/models", async (req, res) => {
    try {
      const response = await fetch(CEREBRAS_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cerebras API error:", errorText);
        return res.status(response.status).json({
          error: "Failed to fetch models from Cerebras API",
          details: errorText,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({
        error: "Failed to fetch models",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/webhook", async (req, res) => {
    try {
      const { model_name, first_message } = req.body;

      if (!model_name || !first_message) {
        return res.status(400).json({
          error: "Missing required fields: model_name and first_message",
        });
      }

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_name,
          first_message,
        }),
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
