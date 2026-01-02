# Phoenix Observability Setup

Phoenix is now integrated for **local development only** to provide observability into your LangGraph agents.

## Quick Start

### 1. Start Services (Docker Compose)

```bash
docker compose up --build
```

This will start:
- **Backend** (FastAPI) - http://localhost:8000
- **Frontend** (Next.js) - http://localhost:3000
- **Phoenix UI** - http://localhost:6006

### 2. Access Phoenix Dashboard

Open http://localhost:6006 in your browser to see:
- Real-time traces of agent executions
- LLM calls with prompts and responses
- Tool invocations and outputs
- Performance metrics (latency, token usage)
- Error tracking

### 3. Generate Traces

Use your app normally - every agent interaction will automatically create traces:

#### Transaction Parser Agent
```bash
# POST to /api/agent/process-stream
# Input: "Bought coffee for $5.50 yesterday"
```

#### Financial Assistant
```bash
# POST to /api/assistant/chat
# Input: "What's my spending this month?"
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PHOENIX_ENABLED` | `true` | Enable/disable Phoenix tracing |
| `PHOENIX_HOST` | `localhost` | Phoenix server host (`phoenix` in Docker) |
| `PHOENIX_PORT` | `6006` | Phoenix server port |
| `PHOENIX_PROJECT_NAME` | `money-intelligence` | Project name in Phoenix UI |

### Local Development (Default)

Phoenix is **enabled** via `docker-compose.yml`. No additional config needed.

### Production (Disabled)

Phoenix is **disabled** in `docker-compose.prod.yml`:
```yaml
environment:
  - PHOENIX_ENABLED=false
```

---

## What Gets Traced?

### Transaction Parser Agent (`app/agent/`)
- User input parsing
- Tool calls: `create_transaction_preview`, `convert_currency`
- Claude Haiku 4 LLM invocations
- Parallel tool execution patterns

### Financial Assistant (`app/assistant/`)
- Conversational queries
- Analytics tool calls (spending analysis, trends)
- Budget/category/tag operations
- Claude Sonnet 4.5 LLM invocations
- Multi-turn agent loops

---

## Phoenix UI Features

### Traces View
- Full execution timeline
- Span details (inputs, outputs, metadata)
- Token usage per LLM call
- Latency breakdown

### Projects
- All traces organized under `money-intelligence` project
- Filter by date, status, duration

### Evaluations (Advanced)
- Run evals on traced data
- Check for hallucinations, relevance, toxicity
- Compare prompt variations

---

## Troubleshooting

### "Phoenix not receiving traces"

1. Check Phoenix is running:
   ```bash
   docker compose ps
   ```

2. Check backend logs:
   ```bash
   docker compose logs backend
   ```

   You should see:
   ```
   ✓ Phoenix observability enabled for project 'money-intelligence'
   View traces at: http://phoenix:6006
   ```

3. Verify `PHOENIX_ENABLED=true` in backend environment

### "ImportError: No module named phoenix"

Run inside your virtual environment:
```bash
uv sync
```

### "Connection refused to Phoenix"

Make sure the Phoenix service is healthy:
```bash
curl http://localhost:6006
```

---

## Disabling Phoenix

### Temporarily (without rebuild)

Stop the Phoenix container:
```bash
docker compose stop phoenix
```

Set in `.env`:
```
PHOENIX_ENABLED=false
```

Restart backend:
```bash
docker compose restart backend
```

### Permanently

Comment out the `phoenix` service in `docker-compose.yml`

---

## Resources

- **Phoenix Docs**: https://docs.arize.com/phoenix
- **LangGraph Tracing**: https://docs.arize.com/phoenix/tracing/integrations-tracing/langgraph
- **Code**: `app/observability.py` for setup logic
