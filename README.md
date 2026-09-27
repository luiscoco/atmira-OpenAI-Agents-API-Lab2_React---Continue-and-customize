# OpenAI Agents API: Lab 02

This React and Node app teaches how to continue an OpenAI Agents API session and customize an agent's instructions. The Node server keeps the API key private and streams agent responses to the browser.

Ask follow-up questions in the same session so the tutor can use earlier messages as context. Then edit the tutor's instructions and start a new session to compare its answers. See [LAB02.md](LAB02.md) for the walkthrough.

## Run locally

```powershell
npm ci
Copy-Item .env.example .env
notepad .env
npm run dev
```

Put your API key in `.env`, then open <http://localhost:5173>. If `.env` already exists, keep it and run `npm run dev` directly.
