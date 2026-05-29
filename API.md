# Audiovox API

This application exposes a minimal API so integrators can generate audio from text or list available voices.

Authentication
- Set an API key in the environment variable `API_KEY` on the server.
- Include the key in requests using the `x-api-key` header or `Authorization: Bearer <key>`.

Endpoints

1) POST /api/tts
- Description: Generate (server-side) audio for the provided text. Current implementation returns a placeholder WAV file.
- Auth: Required
- Body: JSON { text: string }
- Response: audio/wav attachment

Example (curl):

```bash
curl -X POST "http://localhost:3000/api/tts" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"text":"Hello from Audiovox"}' \
  --output audiovox.wav
```

2) GET /api/voices
- Description: List server-available voices (static list).
- Auth: Required
- Response: JSON { voices: [{ name, lang, gender }] }

Example (curl):

```bash
curl -H "x-api-key: $API_KEY" http://localhost:3000/api/voices
```

Notes
- The TTS endpoint is currently a stub that returns silence. Replace its internals to connect to a real TTS provider (ElevenLabs, Google Cloud, Amazon Polly, Azure) and return real audio blobs.
- If you want me to integrate a specific provider, tell me which provider and I'll add the server code and required env vars.
