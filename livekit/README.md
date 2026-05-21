# LiveKit Development Setup

This folder contains the self-hosted LiveKit configuration used by StudySpace video conference rooms.

## Development

The root `docker-compose.yml` already includes the `livekit` service, so you can run the full stack with:

```bash
docker compose up
```

For standalone LiveKit testing from this folder:

```bash
docker compose up
```

## Local Environment

The development defaults are:

- `NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880`
- `LIVEKIT_API_KEY=devkey`
- `LIVEKIT_API_SECRET=devsecret123456789012345678901234567890`

These values are intentionally for local development only. Use strong unique values in production.

## Production Notes

- Use `wss://` behind TLS for `NEXT_PUBLIC_LIVEKIT_URL`.
- Open LiveKit signaling and RTC ports in the firewall.
- Consider a dedicated TURN server for restrictive networks.
- Prefer deploying LiveKit on infrastructure separate from the Next.js app when scaling.
