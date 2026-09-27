# Lab 02 — Continue and customize

Lab 02 is a React and Node app with two lessons: continue a conversation in the same agent session, then change the tutor's instructions and start a new session. The browser displays the session ID, messages, turn count, and streamed answer. The Node server holds the API key and calls the Agents API.

## Run locally

Use Node.js 22 or newer. In PowerShell:

```powershell
npm ci
Copy-Item .env.example .env
notepad .env
npm run dev
```

Set `OPENAI_API_KEY` in `.env`, then open <http://localhost:5173>. If `.env` already exists, keep it and skip the copy step. The optional `OPENAI_MODEL` setting selects the model; the server otherwise uses `gpt-6-astra`.

## How Lab 02 was implemented

### 1. Keep the API key on the server

[`server/index.js`](server/index.js) loads `.env` in Node, defines the tutor's default model and instructions, and exposes `POST /api/lab2/run`. The React app sends requests to this local route; it never sends the API key to the browser.

```js
if (existsSync(join(root, '.env'))) {
  process.loadEnvFile(join(root, '.env'));
}

const agent = {
  model: process.env.OPENAI_MODEL || 'gpt-6-astra',
  instructions:
    'You are a friendly programming tutor. Answer clearly and concisely. ' +
    'When useful, include one short example. If you are unsure, say so.',
};
```

The server checks that the API key is configured and validates the prompt, session ID, and instructions before opening a response stream. A new session needs instructions; a follow-up needs a valid session ID.

### 2. Create the first session

When the request has no `sessionId`, the server starts a session with the current instructions and the first question as input:

```js
stream = await client.beta.agents.sessions.create({
  agent: { ...agent, instructions },
  environment: { type: 'none' },
  input: prompt,
  stream: true,
});
```

`{ ...agent, instructions }` keeps the configured model while applying the instructions from the editor. The `none` environment is enough for this tutor because it answers questions without files or command execution. `stream: true` lets the page show the answer as it arrives. The server takes the session ID from the returned events and sends it to React.

### 3. Continue that session

[`src/Lab2.jsx`](src/Lab2.jsx) saves the returned ID in `sessionRef` and React state. On the next question, it sends the same ID with the prompt. The server opens the event stream **before** adding the new message, so it can receive the earliest events from the new turn:

```js
stream = await client.beta.agents.sessions.events.stream(sessionId);
await client.beta.agents.sessions.events.create(sessionId, {
  events: [{
    type: 'agent.session.input.message',
    input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
  }],
});
```

The session ID stays the same across follow-ups. Each question adds a turn, and the tutor can use messages already in that session as context.

### 4. Forward events and update the page

The server writes newline-delimited JSON (`application/x-ndjson`) to the browser. It accumulates text deltas by output item and sends the current answer, along with session, status, completion, or error events:

```js
if (event.type === 'agent.session.turn.output_text.delta') {
  const key = partKey(event);
  parts.set(key, (parts.get(key) || '') + event.delta);
  writeEvent(response, {
    type: 'text',
    text: [...parts.values()].join('\n'),
  });
}
```

On the client, `runTurn` reads the response body, splits it into lines, parses each JSON event, and calls `onEvent`. The submit handler uses those events to keep the session ID and current assistant message up to date:

```js
if (item.type === 'session') {
  sessionRef.current = item.sessionId;
  setSessionId(item.sessionId);
}
if (item.type === 'text') {
  setMessages((previous) => previous.map((message) =>
    message.id === replyId ? { ...message, text: item.text } : message));
}
```

The reply ID identifies the assistant message being streamed, so each text event updates that message instead of adding a new one. The page renders answer text as Markdown and shows errors in the conversation.

### 5. Apply new instructions to a new session

The editor keeps `draftInstructions` separate from `activeInstructions`. Applying a change saves the edited text and calls `newConversation()`, which clears the local session ID and visible messages:

```js
function applyInstructions() {
  const next = draftInstructions.trim();
  if (!next || next.length > 4000 || status === 'running') return;
  setActiveInstructions(next);
  newConversation();
  setStatusText('Instructions applied. Your next question starts a new session.');
  onFeatureChange('conversation');
}
```

The next question has no session ID, so it follows the session creation path in step 2 with the new instructions. Applying instructions does not change the old session. Copy any earlier answer you want to compare before applying the edit, because the visible conversation is cleared.

### 6. Expose the two lessons

[`src/App.jsx`](src/App.jsx) keeps the selected lesson in `feature` state and passes it to `Lab2`. The sidebar offers **Continue a conversation** and **Customize instructions**. Both lessons share the conversation workspace, so switching between them does not discard an active session. [`src/styles.css`](src/styles.css) supplies the layout, while [`src/speech.js`](src/speech.js) helps choose a browser voice for the optional code explanation read-aloud feature.

## Try it

1. Ask “Explain what an API is in simple terms.” Note the displayed session ID and turn count.
2. Ask “Can you show a JavaScript example?” Confirm the ID stays the same and the turn count increases.
3. Open **Customize instructions**, edit the tutor's style, and select **Apply & start new session**.
4. Ask the first question again. Confirm a new session ID appears and compare the answer with the one you saved.

For a student-facing walkthrough and the code map, see [LAB02.md](LAB02.md).
