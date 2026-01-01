import type { Express } from "express";
import { createServer, type Server } from "http";

const WEBHOOK_URL =
  "https://n8n.dev01.modelmatrix.ai/webhook/d87c25a6-5ebe-4dbe-9f94-504eab7aa23b";

const BATCH_EXECUTOR_URL =
  "https://n8n.dev01.modelmatrix.ai/webhook-test/6e888300-dc95-4d5c-a51a-f10d8afa2ece";

const EVALUATOR_URL =
  "https://n8n.dev01.modelmatrix.ai/webhook/8bc54e6e-7340-4db7-826f-0fd6c8f0c1e0";

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
      const { session_id, model, current_agent, messages, intent_system_prompt, runtime_system_prompt } = req.body;

      if (!session_id || !model) {
        return res.status(400).json({
          error: "Missing required fields: session_id and model",
        });
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: "Messages array is required",
        });
      }

      const webhookPayload: Record<string, unknown> = {
        current_agent: current_agent || "DefaultAgent",
        session_id,
        model,
        messages,
      };
      
      if (intent_system_prompt) {
        webhookPayload.intent_system_prompt = intent_system_prompt;
      }
      if (runtime_system_prompt) {
        webhookPayload.runtime_system_prompt = runtime_system_prompt;
      }

      console.log("Sending webhook request:", JSON.stringify(webhookPayload, null, 2));
      
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      const responseText = await response.text();
      console.log("Webhook response status:", response.status);

      if (!response.ok) {
        console.error("Webhook error:", responseText);
        return res.status(response.status).json({
          error: "Webhook request failed",
          details: responseText,
        });
      }

      if (!responseText || responseText.trim() === "") {
        console.error("Webhook returned empty response");
        return res.status(502).json({
          error: "Webhook returned empty response",
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse webhook response:", parseError);
        return res.status(502).json({
          error: "Webhook returned invalid JSON",
          details: responseText.substring(0, 200),
        });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error calling webhook:", error);
      res.status(500).json({
        error: "Failed to call webhook",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/batch-executor", async (req, res) => {
    try {
      const { limit, specific_ids } = req.body;

      const payload: { limit?: number; specific_ids?: string[] } = {};
      if (limit !== undefined) payload.limit = limit;
      if (specific_ids && Array.isArray(specific_ids)) payload.specific_ids = specific_ids;

      console.log("Batch executor request:", JSON.stringify(payload, null, 2));

      const response = await fetch(BATCH_EXECUTOR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("Batch executor response status:", response.status);

      if (!response.ok) {
        console.error("Batch executor error:", responseText);
        return res.status(response.status).json({
          error: "Batch executor request failed",
          details: responseText,
        });
      }

      if (!responseText || responseText.trim() === "") {
        return res.status(502).json({ error: "Batch executor returned empty response" });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        return res.status(502).json({
          error: "Batch executor returned invalid JSON",
          details: responseText.substring(0, 200),
        });
      }

      res.json(data);
    } catch (error) {
      console.error("Error calling batch executor:", error);
      res.status(500).json({
        error: "Failed to call batch executor",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/evaluator", async (req, res) => {
    try {
      const { run_id } = req.body;

      if (!run_id) {
        return res.status(400).json({ error: "run_id is required" });
      }

      console.log("Evaluator request:", { run_id });

      const response = await fetch(EVALUATOR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id }),
      });

      const responseText = await response.text();
      console.log("Evaluator response status:", response.status);

      if (!response.ok) {
        console.error("Evaluator error:", responseText);
        return res.status(response.status).json({
          error: "Evaluator request failed",
          details: responseText,
        });
      }

      if (!responseText || responseText.trim() === "") {
        return res.status(502).json({ error: "Evaluator returned empty response" });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        return res.status(502).json({
          error: "Evaluator returned invalid JSON",
          details: responseText.substring(0, 200),
        });
      }

      res.json(data);
    } catch (error) {
      console.error("Error calling evaluator:", error);
      res.status(500).json({
        error: "Failed to call evaluator",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return httpServer;
}
