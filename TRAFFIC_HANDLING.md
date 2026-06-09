# Traffic handling

The backend now protects both HTTP and Socket.IO traffic:

- API and authentication-specific rate limits
- Per-socket event throttling and a 1 MB Socket.IO payload cap
- Response compression for payloads larger than 1 KB
- Bounded pagination and indexed database list queries
- Configurable MongoDB connection pooling
- Graceful shutdown for deployments and process restarts

## Configuration

| Variable | Default | Purpose |
| --- | ---: | --- |
| `RATE_LIMIT_WINDOW_MS` | `900000` | API rate-limit window |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Requests per IP per API window |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | `20` | Authentication requests per IP per window |
| `SOCKET_MAX_BUFFER_SIZE` | `1048576` | Maximum Socket.IO event payload in bytes |
| `SOCKET_RATE_LIMIT_WINDOW_MS` | `10000` | Socket event rate-limit window |
| `SOCKET_RATE_LIMIT_MAX_EVENTS` | `100` | Events allowed per socket per window |
| `MONGO_MAX_POOL_SIZE` | `20` | Maximum MongoDB connections per process |
| `MONGO_MIN_POOL_SIZE` | `2` | Minimum MongoDB connections per process |
| `TRUST_PROXY_HOPS` | `0` | Trusted reverse-proxy hop count |
| `HTTP_BODY_LIMIT` | `2mb` | Maximum JSON and URL-encoded request body |
| `SHUTDOWN_TIMEOUT_MS` | `10000` | Maximum graceful-shutdown time |

Set `TRUST_PROXY_HOPS=1` when the backend runs directly behind one trusted load
balancer or reverse proxy. Do not set it to trust every proxy.

## Scaling note

`backend/ecosystem.config.cjs` deliberately runs one Socket.IO process. Starting
multiple independent workers would split meeting rooms between processes. Before
scaling horizontally, add a shared Socket.IO adapter such as Redis and configure
sticky sessions at the load balancer.

List endpoints accept bounded `page` and `limit` query parameters.
