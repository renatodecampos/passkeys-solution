# Passkeys Server

A Fastify-based server implementation for WebAuthn/Passkeys authentication. This server provides endpoints for user registration and authentication using modern passwordless authentication methods.

## Features

- WebAuthn/Passkeys registration and authentication
- MongoDB for user storage
- Redis for challenge management
- Winston logging system
- Request logging interceptor
- TypeScript support
- Environment-based configuration

## Prerequisites

- Node.js 20+
- Docker (for MongoDB and Redis via `docker-compose up -d`)
- [mkcert](https://github.com/FiloSottile/mkcert) — required for HTTPS certificates
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/renatodecampos/passkeys-server.git
cd passkeys-server
```

2. Install dependencies:
```bash
npm install
```

3. Generate HTTPS certificates (required — server only runs on HTTPS):
```bash
mkcert -install   # installs local CA (run once, requires sudo)
cd certs
mkcert localhost 127.0.0.1 ::1
cd ..
```

4. Create a `.env` file:
```bash
cp .env-example .env
```

5. Update the `.env` file with your configuration:
- Set your MongoDB credentials
- Configure Redis connection
- Set your WebAuthn relying party details
- Configure session and logging settings

## Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default: 3000) |
| `HOST` | Server host (default: 0.0.0.0) |
| `MONGODB_URI` | MongoDB connection string |
| `DB_NAME` | MongoDB database name |
| `COLLECTION_NAME` | MongoDB collection name for users |
| `REDIS_URL` | Redis URL (e.g. `redis://localhost:6379`) |
| `RP_ID` | WebAuthn relying party ID |
| `RP_NAME` | WebAuthn relying party display name |
| `RP_ORIGIN` | WebAuthn relying party origin (`https://localhost:3000`) |
| `ANDROID_ORIGIN` | Android app origin for WebAuthn (`android:apk-key-hash:<base64>`) |
| `ANDROID_CERT_FINGERPRINT` | SHA256 of Android debug keystore |
| `SESSION_SECRET` | Session cookie signing key |
| `LOG_LEVEL` | Winston log level (error, warn, info, debug) |

## API Endpoints

### Registration

- `POST /generate-registration-options`
  - Request body: `{ username: string }`
  - Returns registration options for WebAuthn

- `POST /verify-registration`
  - Request body: Registration response from authenticator
  - Verifies and stores the new credential

### Authentication

- `POST /generate-authentication-options`
  - Request body: `{ username: string }`
  - Returns authentication options for WebAuthn

- `POST /verify-authentication`
  - Request body: Authentication response from authenticator
  - Verifies the authentication attempt

## Development

1. Start infrastructure:
```bash
docker-compose up -d
```

2. Start the development server (always HTTPS):
```bash
npm run dev
# verify: curl -k https://localhost:3000/health → {"status":"ok"}
```

3. Run tests:
```bash
npm test           # Jest with coverage (≥80% on registration/ and authentication/)
npm run test:watch
```

3. Build for production:
```bash
npm run build
```

## Logging

The server uses Winston for logging with the following features:
- Console output with colors
- File-based logging in `logs/` directory
- Separate error logs
- Request logging with timing information
- Configurable log levels

## Security Considerations

- Always use HTTPS in production
- Keep your session secret secure
- Regularly rotate credentials
- Monitor logs for suspicious activity
- Keep dependencies updated

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
