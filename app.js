// mcp-server/index.js
const express = require("express"),
 bodyParser = require("body-parser"),
 fs = require("fs/promises"),
{ v4: uuidv4 } = require("uuid");
const seeds_dictionary_prompts = require("./seeds_dictionary_prompts");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// In-memory storage (replace with DB in prod)
const threads = {}; // { threadId: { files: [], selection: {}, actions: [] } }

// GET /v1/mcp/threads/:thread_id/context
app.get("/v1/mcp/threads/:thread_id/context", async (req, res) => {
  const threadId = req.params.thread_id;
  const context = threads[threadId] || {
    files: [],
    selection: null,
    git_diff: null,
    project_name: "cursor-project"
  };
  res.json(context);
});

// POST /v1/mcp/threads/:thread_id/steps
app.post("/v1/mcp/threads/:thread_id/steps", async (req, res) => {
  const threadId = req.params.thread_id;
  const action = req.body.action;

  if (!threads[threadId]) threads[threadId] = { files: [], selection: null, actions: [] };
  threads[threadId].actions.push(action);

  if (action.type === "update_file") {
    await fs.writeFile(action.path, action.content, "utf-8");
  }

  res.json({ status: "ok" });
});

// GET /v1/mcp/threads/:thread_id/messages
app.get("/v1/mcp/threads/:thread_id/messages", async (req, res) => {
  const threadId = req.params.thread_id;
  const messages = threads[threadId]?.messages || [];
  res.json(messages);
});

// POST /v1/mcp/threads/:thread_id/messages
app.post("/v1/mcp/threads/:thread_id/messages", async (req, res) => {
  const threadId = req.params.thread_id;
  const message = req.body;

  if (!threads[threadId]) threads[threadId] = { files: [], selection: null, actions: [], messages: [] };
  threads[threadId].messages = threads[threadId].messages || [];
  threads[threadId].messages.push({ id: uuidv4(), ...message });

  const seed_data = seeds_dictionary_prompts[message.seed?.id];
  if(!seed_data)
    res.status(200).send("OK");
  
  const { reply, step } = await seed_data.action(message.seed, threads[threadId].messages);
  threads[threadId].messages.push(reply);
  threads[threadId].messages.steps.push(step);

  return res.status(200).json(reply);
});

// GET /v1/mcp/seeds
app.get("/v1/mcp/seeds", (req, res) => {
  res.json([
    {
      id: "generate_react_component",
      name: "Generate React Component",
      description: "Genera un componente React desde descripción y nombre.",
      input_schema: {
        type: "object",
        properties: {
          componentName: { type: "string" },
          description: { type: "string" }
        },
        required: ["componentName", "description"]
      }
    }
  ]);
});

module.exports = app;