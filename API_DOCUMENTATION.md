# ConnectSphere API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except public ones) require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "jwt_token"
  }
}
```

---

### Login User
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "jwt_token"
  }
}
```

---

### Get User Profile
```
GET /auth/profile
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "url",
    "bio": "User bio",
    "role": "user"
  }
}
```

---

### Logout
```
POST /auth/logout
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Room Endpoints

### Create Room
```
POST /rooms/create
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Team Meeting",
  "description": "Weekly sync",
  "isPrivate": false,
  "maxParticipants": 50
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "roomId": "room_xyz",
    "title": "Team Meeting",
    "createdBy": "user_id",
    "createdAt": "2024-05-23T10:00:00Z"
  }
}
```

---

### Join Room
```
POST /rooms/join
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "roomId": "room_xyz",
  "password": "optional_password"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Joined room successfully",
  "data": {
    "roomId": "room_xyz",
    "participants": ["user_id_1", "user_id_2"],
    "joinedAt": "2024-05-23T10:05:00Z"
  }
}
```

---

### Get Room Details
```
GET /rooms/:roomId
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Room retrieved",
  "data": {
    "roomId": "room_xyz",
    "title": "Team Meeting",
    "description": "Weekly sync",
    "createdBy": "user_id",
    "participants": ["user_id_1", "user_id_2"],
    "maxParticipants": 50,
    "isActive": true,
    "createdAt": "2024-05-23T10:00:00Z"
  }
}
```

---

### Get All Rooms
```
GET /rooms
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Rooms retrieved",
  "data": [
    {
      "roomId": "room_xyz",
      "title": "Team Meeting",
      "participants": ["user_id_1"],
      "createdAt": "2024-05-23T10:00:00Z"
    }
  ]
}
```

---

### Leave Room
```
POST /rooms/:roomId/leave
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Left room successfully"
}
```

---

## File Endpoints

### Upload File
```
POST /files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File object
- `roomId`: Room ID

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileId": "file_xyz",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "uploadedAt": "2024-05-23T10:00:00Z"
  }
}
```

---

### Download File
```
GET /files/download/:fileId
Authorization: Bearer <token>
```

**Response:** `200 OK`
- File binary stream

---

### Get Room Files
```
GET /files/room/:roomId
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Files retrieved",
  "data": [
    {
      "fileId": "file_xyz",
      "fileName": "document.pdf",
      "fileSize": 1024000,
      "uploadedBy": "user_id",
      "uploadedAt": "2024-05-23T10:00:00Z"
    }
  ]
}
```

---

### Delete File
```
DELETE /files/:fileId
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## Message Endpoints

### Send Message
```
POST /messages/send
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "roomId": "room_xyz",
  "content": "Hello everyone!",
  "type": "text"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "msg_xyz",
    "senderId": "user_id",
    "roomId": "room_xyz",
    "content": "Hello everyone!",
    "timestamp": "2024-05-23T10:00:00Z"
  }
}
```

---

### Get Room Messages
```
GET /messages/room/:roomId?page=1&limit=50
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Messages retrieved",
  "data": [
    {
      "messageId": "msg_xyz",
      "senderId": "user_id",
      "sender": {
        "name": "John Doe",
        "avatar": "url"
      },
      "content": "Hello everyone!",
      "timestamp": "2024-05-23T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```

---

### Edit Message
```
PUT /messages/:messageId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Updated message"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Message updated successfully"
}
```

---

### Delete Message
```
DELETE /messages/:messageId
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

## Socket Events

### Join Room
```javascript
socket.emit('join-room', roomId, userId);
```

**Response:**
```javascript
socket.on('user-connected', (data) => {
  // { userId, socketId }
});
```

---

### Send Message
```javascript
socket.emit('send-message', {
  roomId,
  senderId,
  content,
  timestamp
});
```

**Response:**
```javascript
socket.on('receive-message', (message) => {
  // Message object
});
```

---

### User Disconnected
```javascript
socket.on('user-disconnected', (socketId) => {
  // socketId of disconnected user
});
```

---

### Screen Share
```javascript
socket.emit('screen-share', {
  roomId,
  streamId,
  timestamp
});
```

---

### Whiteboard Update
```javascript
socket.emit('whiteboard-update', {
  roomId,
  data: drawingData,
  timestamp
});

socket.on('whiteboard-update', (update) => {
  // Update object
});
```

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "No token provided"
}
```

### Not Found Error
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Rate Limiting

- Default limits:
  - General API: 200 requests per 15 minutes per IP (configurable)
  - Auth endpoints: 50 requests per 15 minutes per user/IP (configurable)

- Response: when a limit is exceeded the server returns HTTP `429 Too Many Requests` with JSON:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

- Headers (when supported by client):
  - `X-RateLimit-Limit`: configured limit
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when window resets

- Configuration (env vars / `src/config.js`):
  - `RATE_LIMIT_WINDOW_MS` — window size in milliseconds (default 900000)
  - `RATE_LIMIT_MAX_REQUESTS` — general API max requests (default 200)
  - `AUTH_RATE_LIMIT_MAX_REQUESTS` — auth endpoints max requests (default 50)

- Distributed limits (optional):
  - To enable Redis-backed distributed rate limiting set:

```powershell
$env:REDIS_URL="redis://localhost:6379"
$env:ENABLE_REDIS="true"
```

  - When enabled the server uses Redis for shared counters across instances.

- Metrics and observability:
  - The server exposes Prometheus metrics at `/metrics` (e.g. `http://localhost:5000/metrics`).
  - Metrics added:
    - `connectsphere_rate_limit_http_total{route,ip}` — number of HTTP rate limit events
    - `connectsphere_rate_limit_socket_total{socketId}` — number of socket rate limit events


---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Testing

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Create Room:**
```bash
curl -X POST http://localhost:5000/api/rooms/create \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Meeting","description":"Team sync"}'
```

---

Last Updated: May 23, 2026
