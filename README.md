# Money Intelligence

AI-powered personal finance management with conversational insights and intelligent transaction processing. Chat with your finances, upload receipts, or simply describe transactions in natural language.

## Features

- **AI Transaction Input** - Create transactions from text, audio, or images (receipts/screenshots)
- **Conversational Finance Agent** - Chat with your finances for insights and personalized recommendations
- **Transaction Management** - Track and categorize all your financial activities
- **Multi-Account Support** - Manage multiple accounts in one place
- **Budget Tracking** - Set and monitor budgets across categories
- **Flexible Organization** - Custom tags and categories for personalized organization

## Tech Stack

**Backend**
- FastAPI (Python)
- LangGraph for agentic AI workflows
- SQLAlchemy ORM

**Frontend**
- Next.js 15 with React 19
- Tailwind CSS + Radix UI components
- TypeScript

## Getting Started

### Prerequisites
- Python 3.13+
- Node.js 18+
- PostgreSQL (or your preferred database)

### Backend Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Run the server
fastapi dev app/main.py

```

API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
├── app/
│   ├── agent/          # LangGraph AI agent implementation
│   ├── routers/        # FastAPI route handlers
│   ├── crud/           # Database operations
│   ├── schemas/        # Pydantic data models
│   └── database/       # Database configuration and models
└── frontend/
    ├── app/            # Next.js app directory
    └── components/     # React components
```