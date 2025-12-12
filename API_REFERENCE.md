# Account-Level Form Isolation: API Reference

## Authentication
All endpoints require Bearer token authentication in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Form Endpoints

### List Forms
**GET /api/forms**

**Authentication:** Optional (auth())

**Response:**
- Admins: Forms from their account + public forms
- Users: Public forms + forms shared with them
- Anonymous: Empty array

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/forms
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Customer Feedback",
      "created_by": 1,
      "account_id": 1,
      "created_at": "2025-12-10T00:00:00.000Z"
    }
  ]
}
```

---

### Get Form Details
**GET /api/forms/:id**

**Authentication:** Optional (auth())

**Response:** Form with fields if user has access

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/forms/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Customer Feedback",
    "created_by": 1,
    "account_id": 1,
    "created_at": "2025-12-10T00:00:00.000Z",
    "fields": [
      {
        "id": 1,
        "form_id": 1,
        "label": "Name",
        "type": "text",
        "is_required": true,
        "ai_validation_enabled": false
      }
    ]
  }
}
```

**Error Response (Access Denied):**
```json
{
  "success": false,
  "message": "Access denied"
}
```

---

### Create Form
**POST /api/forms**

**Authentication:** Required (admin role)

**Request Body:**
```json
{
  "title": "Survey Form",
  "fields": [
    {
      "label": "Your Name",
      "type": "text",
      "is_required": true,
      "ai_validation_enabled": true,
      "expected_entity": "person",
      "expected_sentiment": "any"
    },
    {
      "label": "Rating",
      "type": "number",
      "is_required": true,
      "ai_validation_enabled": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "form": {
      "id": 2,
      "title": "Survey Form",
      "created_by": 1,
      "account_id": 1,
      "created_at": "2025-12-10T10:30:00.000Z"
    },
    "fields": [...]
  }
}
```

**Note:** Form is automatically assigned to creator's account

---

### Update Form
**PUT /api/forms/:id**

**Authentication:** Required (admin role, must be creator or account admin)

**Request Body:**
```json
{
  "title": "Updated Survey",
  "fields": [...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "form": {...},
    "fields": [...]
  }
}
```

**Error Response (Unauthorized):**
```json
{
  "success": false,
  "message": "Access denied"
}
```

---

### Delete Form
**DELETE /api/forms/:id**

**Authentication:** Required (admin role, must be creator or account admin)

**Response:**
```json
{
  "success": true,
  "message": "Form deleted successfully. Forms have been renumbered sequentially."
}
```

---

### Delete Multiple Forms
**DELETE /api/forms/multiple**

**Authentication:** Required (admin role)

**Request Body:**
```json
{
  "formIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 form(s) deleted successfully. Forms have been renumbered sequentially."
}
```

---

### Delete All Forms
**DELETE /api/forms/all**

**Authentication:** Required (admin role)

**Response:**
```json
{
  "success": true,
  "message": "All 5 form(s) deleted successfully. Form ID counter has been reset."
}
```

---

## Form Sharing Endpoints

### Share a Form
**POST /api/forms/:formId/share**

**Authentication:** Required (admin role, must be creator or account admin)

**Request Body:**
```json
{
  "userId": 5,
  "permissionType": "view"
}
```

Or share with account:
```json
{
  "accountId": 2,
  "permissionType": "edit"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form shared successfully"
}
```

**Permission Types:**
- `view`: User can view the form and submit it
- `edit`: User can view and potentially edit the form
- `admin`: User has full administrative access

---

### Get Form Permissions
**GET /api/forms/:formId/permissions**

**Authentication:** Required (admin role, must be creator or account admin)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "form_id": 1,
      "user_id": 5,
      "account_id": null,
      "permission_type": "view",
      "created_at": "2025-12-10T10:30:00.000Z",
      "user": {
        "id": 5,
        "email": "user@example.com"
      }
    },
    {
      "id": 2,
      "form_id": 1,
      "user_id": null,
      "account_id": 2,
      "permission_type": "edit",
      "created_at": "2025-12-10T10:35:00.000Z",
      "accountOwner": {
        "id": 2,
        "email": "admin2@example.com"
      }
    }
  ]
}
```

---

### Revoke Form Access
**DELETE /api/forms/:formId/permissions/:permissionId**

**Authentication:** Required (admin role, must be creator or account admin)

**Response:**
```json
{
  "success": true,
  "message": "Access revoked successfully"
}
```

---

## Account Structure

### User Object with Account Info
```json
{
  "id": 1,
  "email": "admin@example.com",
  "role": "admin",
  "account_id": 1,
  "is_account_owner": true,
  "created_at": "2025-12-10T00:00:00.000Z"
}
```

### Account Owner
- `is_account_owner`: true
- `account_id`: Their own user ID
- Can create forms (assigned to their account_id)
- Can view all forms in their account
- Can share forms with others
- Can delete forms from their account

### Account Member
- `is_account_owner`: false
- `account_id`: Owner's user ID
- Cannot create forms
- Can view shared forms
- Cannot manage forms or permissions

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "errors": [
    {
      "param": "title",
      "msg": "Invalid value"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden: insufficient role"
}
```

Or for access denied:
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Form not found"
}
```

---

## Form Field Types

Supported field types:
- `text`: Single line text input
- `email`: Email input with validation
- `number`: Numeric input
- `textarea`: Multi-line text input
- `phone`: Phone number input
- `date`: Date picker
- `select`: Dropdown selection
- `checkbox`: Checkbox input
- `file`: File upload

---

## Testing with cURL

### Login and Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### Create a Form
```bash
curl -X POST http://localhost:3000/api/forms \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Form",
    "fields": [
      {
        "label": "Name",
        "type": "text",
        "is_required": true
      }
    ]
  }'
```

### List Forms
```bash
curl -X GET http://localhost:3000/api/forms \
  -H "Authorization: Bearer <TOKEN>"
```

### Share a Form
```bash
curl -X POST http://localhost:3000/api/forms/1/share \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "permissionType": "view"
  }'
```

### Get Permissions
```bash
curl -X GET http://localhost:3000/api/forms/1/permissions \
  -H "Authorization: Bearer <TOKEN>"
```

### Revoke Access
```bash
curl -X DELETE http://localhost:3000/api/forms/1/permissions/1 \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Summary of Changes

| Endpoint | Method | Auth | Permission Check |
|----------|--------|------|------------------|
| /forms | GET | Optional | None (filtered by account) |
| /forms | POST | Admin | None (admin only) |
| /forms/:id | GET | Optional | Access check |
| /forms/:id | PUT | Admin | Creator/Account admin |
| /forms/:id | DELETE | Admin | Creator/Account admin |
| /forms/multiple | DELETE | Admin | Per-form check |
| /forms/all | DELETE | Admin | Account specific |
| /forms/:id/share | POST | Admin | Creator/Account admin |
| /forms/:id/permissions | GET | Admin | Creator/Account admin |
| /forms/:id/permissions/:pid | DELETE | Admin | Creator/Account admin |

---

## Migration Command

```bash
cd backend
node migrate-accounts.js
```

This command:
1. Sets brawler612@gmail.com as account owner
2. Assigns jushuapeterte@gmail.com to the account
3. Assigns all existing forms to the account
