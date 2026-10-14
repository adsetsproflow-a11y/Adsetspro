# SAAA SaaS Platform — API Documentation & Postman Contract

This document provides complete documentation for the SAAA SaaS multi-tenant authentication and authorization API suite, including HTTP methods, headers, request schemas, status codes, and example payloads.

---

## 🔐 Authentication Architecture Overview

- **Access Tokens**: Short-lived JWTs (15 minutes). Sent in the `Authorization: Bearer <token>` header or `saas_access_token` HttpOnly cookie.
- **Refresh Tokens**: Rotating cryptographically secure tokens (7 days). Stored hashed in PostgreSQL (`RefreshToken`).
- **Reuse Detection**: Presenting an already-revoked refresh token immediately revokes all active sessions for that user family and logs a security alert.
- **Password Security**: Bcrypt with 12 salt rounds.
- **Tenant Context**: Path-based (`/c/[companySlug]`), strictly verified server-side via `CompanyMembership`.

---

## 1. Authentication Endpoints

### 1.1 Company Registration
- **URL**: `POST /api/auth/register`
- **Access**: Public (Rate-Limited)
- **Description**: Registers a new company admin and company workspace. Company status is set to `PENDING` awaiting Super Admin review. Generates a collision-safe unique company slug and sends an email verification token.

#### Request Body
```json
{
  "companyName": "Nexus Creative Media",
  "adminName": "Alex Vance",
  "email": "alex@nexusmedia.io",
  "password": "Password@2026!",
  "confirmPassword": "Password@2026!",
  "department": "Design",
  "acceptTerms": true
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Company registered successfully! Please check your email to verify your address. Note that your workspace requires Super Admin approval before activation.",
  "company": {
    "id": "e4c9f131-4fa3-42e6-993d-d4fa2312b6a8",
    "name": "Nexus Creative Media",
    "slug": "nexus-creative-media-a4b2",
    "status": "PENDING"
  },
  "requiresApproval": true,
  "emailSent": true
}
```

---

### 1.2 User Login
- **URL**: `POST /api/auth/login`
- **Access**: Public (Rate-Limited)
- **Description**: Authenticates users (Super Admin, Company Admin, or Employee). Sets HttpOnly cookies `saas_access_token` and `saas_refresh_token`. Returns redirect URL based on role and company approval status.

#### Request Body
```json
{
  "email": "owner@adsetspro.com",
  "password": "SuperAdmin@2026!Secure",
  "rememberMe": true
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Authentication successful.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c89b7201-9c84-48b9-8e40-52e06c7104b9",
    "name": "Platform Super Admin",
    "email": "owner@adsetspro.com",
    "globalRole": "SUPER_ADMIN",
    "emailVerified": true,
    "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
  },
  "company": null,
  "accessStatus": "ACTIVE",
  "redirectUrl": "/super-admin/dashboard"
}
```

---

### 1.3 Refresh Token Rotation
- **URL**: `POST /api/auth/refresh`
- **Access**: Refresh Session (`saas_refresh_token` cookie or request body)
- **Description**: Rotates the refresh token and issues a new access token. If token reuse is detected, all sessions for the user are immediately revoked.

#### Request Body (Optional if sent via cookie)
```json
{
  "refreshToken": "48-byte-raw-refresh-hex-token"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Token rotated successfully.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response (401 Unauthorized — Reuse Attack)
```json
{
  "success": false,
  "error": "Security alert: Refresh token reuse detected. All active sessions have been revoked."
}
```

---

### 1.4 User Logout
- **URL**: `POST /api/auth/logout`
- **Access**: Authenticated
- **Description**: Revokes the refresh token in the database, clears HttpOnly auth cookies, and audits the event.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

### 1.5 Get Current Session (`/auth/me`)
- **URL**: `GET /api/auth/me`
- **Access**: Authenticated
- **Description**: Returns the authenticated user's profile, roles, active company membership, and list of associated companies.

#### Response (200 OK)
```json
{
  "success": true,
  "user": {
    "id": "c89b7201-9c84-48b9-8e40-52e06c7104b9",
    "name": "Sarah Lin",
    "email": "sarah@apex.agency",
    "globalRole": "USER",
    "accountStatus": "ACTIVE",
    "emailVerified": true,
    "avatarUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    "createdAt": "2026-10-14T13:30:00.000Z"
  },
  "activeMembership": {
    "id": "m-123",
    "companyId": "c-456",
    "companyName": "Apex Agency",
    "companySlug": "apex",
    "companyStatus": "ACTIVE",
    "role": "COMPANY_ADMIN",
    "designation": "Company CEO",
    "department": "Management",
    "membershipStatus": "ACTIVE"
  },
  "memberships": [...]
}
```

---

### 1.6 Forgot Password
- **URL**: `POST /api/auth/forgot-password`
- **Access**: Public (Rate-Limited)
- **Description**: Requests a password reset link. Returns generic response to prevent email enumeration.

#### Request Body
```json
{
  "email": "sarah@apex.agency"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "If an account exists for that email, a password reset link has been dispatched. Please check your inbox."
}
```

---

### 1.7 Reset Password
- **URL**: `POST /api/auth/reset-password`
- **Access**: Public with valid single-use token
- **Description**: Validates token, hashes new password, marks token as used, and revokes all active refresh tokens for the user.

#### Request Body
```json
{
  "token": "32-byte-raw-reset-token",
  "newPassword": "NewSecurePassword@2026!",
  "confirmNewPassword": "NewSecurePassword@2026!"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Password reset successfully! You can now log in with your new credentials."
}
```

---

### 1.8 Change Password
- **URL**: `POST /api/auth/change-password`
- **Access**: Authenticated
- **Description**: Verifies current password, updates to new password, and invalidates other sessions.

#### Request Body
```json
{
  "currentPassword": "OldPassword@2026!",
  "newPassword": "NewStrongPassword@2026!",
  "confirmNewPassword": "NewStrongPassword@2026!"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Password changed successfully. Please log in again with your new password."
}
```

---

### 1.9 Email Verification
- **URL**: `POST /api/auth/verify-email`
- **Access**: Public with single-use verification token

#### Request Body
```json
{
  "token": "32-byte-raw-verification-token"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Email verified successfully! You can now access your account.",
  "email": "alex@nexusmedia.io"
}
```

---

## 2. Employee Invitations Endpoints

### 2.1 Send Employee Invitation
- **URL**: `POST /api/company/invitations`
- **Access**: Active Company Admin
- **Description**: Invites an employee to the admin's company. Derives `companyId` strictly from the session token.

#### Request Body
```json
{
  "fullName": "David Chen",
  "email": "david@nexusmedia.io",
  "designation": "Lead Full-Stack Developer",
  "department": "Development",
  "expiryDays": 7
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Invitation successfully sent to david@nexusmedia.io.",
  "invitation": {
    "id": "inv-7b9148d2-...",
    "email": "david@nexusmedia.io",
    "name": "David Chen",
    "designation": "Lead Full-Stack Developer",
    "status": "PENDING",
    "expiresAt": "2026-10-21T13:30:00.000Z"
  },
  "inviteLink": "/accept-invitation?token=32-byte-raw-token"
}
```

---

### 2.2 Accept Employee Invitation
- **URL**: `POST /api/invitations/accept`
- **Access**: Public with invitation token
- **Description**: Validates token and company active status. Creates or activates employee User and CompanyMembership records. Sets auth cookies and returns direct workspace redirect.

#### Request Body
```json
{
  "token": "32-byte-raw-token",
  "fullName": "David Chen",
  "password": "EmployeePassword@2026!",
  "confirmPassword": "EmployeePassword@2026!"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Welcome to Nexus Creative Media! Your account is now active.",
  "redirectUrl": "/c/nexus-creative-media-a4b2/my-tasks",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "company": {
    "id": "e4c9f131-...",
    "name": "Nexus Creative Media",
    "slug": "nexus-creative-media-a4b2"
  }
}
```

---

## 3. Super Admin Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/super-admin/companies` | List all companies with approval status, admin info, and employee counts |
| `POST` | `/api/super-admin/companies/:id/approve` | Approve pending company registration (sets status to ACTIVE) |
| `POST` | `/api/super-admin/companies/:id/reject` | Reject registration with reason |
| `POST` | `/api/super-admin/companies/:id/suspend` | Suspend company workspace with reason (locks employee access) |
| `POST` | `/api/super-admin/companies/:id/reactivate` | Reactivate suspended company workspace |
| `GET` | `/api/super-admin/audit-logs` | Retrieve chronological security and administrative audit trail |
