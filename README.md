# MIKASA AI Agent

**Version:** 5.0.0  
**Project Type:** Personal AI Agent  
**Status:** Successfully Tested

## Overview

MIKASA is a locally powered personal AI agent designed to perform intelligent conversations, process documents, maintain long-term memory, search the web, perform calculations, and control Windows PC operations.

The project combines local Large Language Models, a FastAPI backend, and a React-based frontend to provide an interactive AI assistant with multiple capabilities.

MIKASA uses Ollama to run AI models locally, allowing users to interact with their assistant without depending entirely on external AI APIs.

## Features

### AI Chat
- Intelligent conversations using locally running AI models.
- Powered by Ollama and Qwen 2.5.
- Real-time interaction through the web interface.

### Document Intelligence
- Read PDF documents.
- Process DOCX files.
- Read TXT files.
- Generate document summaries.
- Answer questions based on uploaded documents.
- Support multiple document storage.
- Provide source references for document-based answers.

### Long-Term Memory
- Store important information using SQLite.
- Retain information across conversations.
- Retrieve previously stored information.

### Conversation History
- Maintain previous conversations.
- Create and manage conversations.
- Access earlier chat sessions.

### Web Search
- Retrieve information from the internet.
- Support queries requiring current information.

### Agent Calculations
- Perform mathematical calculations.
- Process calculation requests through the agent backend.

### Windows PC Control
- Execute supported Windows PC operations.
- Interact with system-level functionality through the agent.

## Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS
- Lucide React

### Backend
- Python
- FastAPI
- Uvicorn
- REST API

### Artificial Intelligence
- Ollama
- Qwen 2.5 3B

### Database
- SQLite
- Persistent conversation and memory storage

### Document Processing
- PDF processing libraries
- DOCX processing libraries
- Text extraction and keyword-based retrieval

### Development Environment
- Visual Studio Code
- Windows
- Node.js
- Python

## Project Structure

```text
MIKASA/
|
|-- backend/
|   |
|   |-- main.py
|   |-- requirements.txt
|   |-- .env.example
|   |-- mikasa_memory.db
|
|-- frontend/
|   |
|   |-- src/
|   |   |-- App.jsx
|   |   |-- App.css
|   |   |-- api.js
|   |
|   |-- public/
|   |-- package.json
|   |-- index.html
|
|-- README.md
```

## Installation and Setup

### Prerequisites

Install the following software before running MIKASA:

1. Python
2. Node.js and npm
3. Visual Studio Code
4. Ollama

### Step 1: Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
```

Navigate to the project directory:

```bash
cd mikasa
```

### Step 2: Set Up the Backend

Open the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the environment:

```bash
venv\Scripts\activate
```

Install the required dependencies:

```bash
python -m pip install -r requirements.txt
```

### Step 3: Configure Ollama

Install Ollama and download the required model:

```bash
ollama pull qwen2.5:3b
```

Verify the installed model:

```bash
ollama list
```

Ensure that Ollama is running locally.

### Step 4: Start the Backend Server

From the backend directory, execute:

```bash
python -m uvicorn main:app --reload
```

The backend server will be available at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

### Step 5: Set Up the Frontend

Open a second VS Code integrated terminal.

Navigate to the frontend directory:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

### Step 6: Start the Frontend

Execute:

```bash
npm run dev
```

Open the local development URL displayed by Vite, usually:

```text
http://localhost:5173
```

MIKASA is now ready to use.

## System Architecture

MIKASA follows a frontend and backend architecture.

**Frontend Layer**

The React application provides the user interface and sends requests to the backend.

**Backend Layer**

FastAPI processes user requests, manages application functionality, communicates with Ollama, and handles document processing.

**AI Layer**

Ollama runs the Qwen 2.5 model locally to generate intelligent responses.

**Memory Layer**

SQLite stores conversation history and persistent memory.

**Integration Layer**

The agent connects supported tools and system operations to perform web searches, calculations, document processing, and Windows PC control.

## Important Notes

1. Ollama must be installed and running before using local AI chat.
2. The Qwen 2.5 3B model must be downloaded.
3. Backend and frontend servers must both be running.
4. The SQLite database stores persistent application data.
5. Scanned image-only PDFs require OCR, which is not currently included.
6. Document retrieval currently uses text extraction and keyword matching rather than vector embeddings.
7. Keep environment files and local databases secure.

## Current Project Status

**MIKASA v5.0.0**

The fifth version has been successfully implemented and tested.

The following capabilities have been tested:

- AI chat
- PDF, DOCX, and TXT processing
- Document summarization and question answering
- Long-term memory
- Conversation history
- Web search
- Agent calculations
- Windows PC control

## Author

**Alok Thakur**

## License

This project is developed as a personal AI agent project. Licensing and redistribution terms can be defined by the repository owner.
