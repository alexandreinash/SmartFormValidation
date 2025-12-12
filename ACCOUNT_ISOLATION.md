# Account-Level Form Isolation Implementation

This document outlines the changes made to implement account-level form isolation in the SmartFormValidation system.

## Overview

Forms created by admins are now isolated at the account level. Each admin can only see forms created by their account, and end-users can only see public forms or forms explicitly shared with them.

## Database Schema Changes

### Users Table Updates

Added two new columns to the `users` table:
- `account_id` (INT, NULL): References the account owner's user ID. For account owners, this is their own ID. For regular users, this is the ID of the account owner.
- `is_account_owner` (BOOLEAN, DEFAULT FALSE): Indicates whether this user is an account owner.

Example:
```
Admin (account owner): id=1, email=brawler612@gmail.com, role=admin, account_id=1, is_account_owner=true
User: id=2, email=jushuapeterte@gmail.com, role=user, account_id=1, is_account_owner=false
```

### Forms Table Updates

Added one new column:
- `account_id` (INT, NULL): References the account owner's user ID. If NULL, the form is public.

### New Table: form_permissions

A new table `form_permissions` was created to support sharing forms across account boundaries:

```sql
CREATE TABLE form_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT NOT NULL,
  user_id INT NULL,
  account_id INT NULL,
  permission_type ENUM('view', 'edit', 'admin') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_form_user_permission (form_id, user_id),
  UNIQUE KEY unique_form_account_permission (form_id, account_id)
)
```

## Backend Model Changes

### User Model (`src/models/User.js`)
- Added `account_id` and `is_account_owner` fields
- Added associations for account membership

### Form Model (`src/models/Form.js`)
- Added `account_id` field
- Added association to account owner

### New Model: FormPermission (`src/models/FormPermission.js`)
- Created to manage form sharing and permissions

## Backend Controller Changes (`src/controllers/formController.js`)

### createForm()
- Now associates forms with the admin's account at creation time
- If admin is an account owner: `account_id = user.id`
- If admin is an account member: `account_id = user.account_id`

### listForms()
- **For admins**: Shows all forms in their account + public forms
- **For regular users**: Shows only public forms + forms shared with them
- **For anonymous**: Shows no forms

### getForm()
- Added access control via `checkFormAccess()` helper function
- Checks if form is public, if user is in the same account, or if form is shared

### deleteForm(), updateForm(), deleteMultipleForms()
- Added permission checks to ensure only creators or account admins can modify forms

### New Endpoints

#### shareForm(POST /forms/:formId/share)
- Shares a form with a specific user or account
- Requires: creator or account admin permission
- Request body:
  ```json
  {
    "userId": 2,        // optional: share with specific user
    "accountId": 1,     // optional: share with specific account
    "permissionType": "view"  // "view", "edit", or "admin"
  }
  ```

#### getFormPermissions(GET /forms/:formId/permissions)
- Lists all permissions for a form
- Requires: creator or account admin permission

#### revokeFormAccess(DELETE /forms/:formId/permissions/:permissionId)
- Removes specific form permission
- Requires: creator or account admin permission

## Route Changes (`src/routes/forms.js`)

- POST /forms/ - requires auth('admin')
- GET /forms/ - optional auth (uses auth() which allows unauthenticated access)
- GET /forms/:id - optional auth
- PUT /forms/:id - requires auth('admin')
- POST /forms/:formId/share - requires auth('admin')
- GET /forms/:formId/permissions - requires auth('admin')
- DELETE /forms/:formId/permissions/:permissionId - requires auth('admin')
- DELETE /forms/all - requires auth('admin')
- DELETE /forms/multiple - requires auth('admin')
- DELETE /forms/:id - requires auth('admin')

## Middleware Changes (`src/middleware/auth.js`)

The auth middleware now supports optional authentication:
- If a role is specified (e.g., `auth('admin')`), authentication is required
- If no role is specified (e.g., `auth()`), authentication is optional and `req.user` will be null for unauthenticated requests

## Migration Script

A migration script (`migrate-accounts.js`) has been created to update existing data:

```bash
node migrate-accounts.js
```

**What it does:**
1. Sets `brawler612@gmail.com` as an account owner with `account_id = their_own_id`
2. Assigns `jushuapeterte@gmail.com` to the same account with `account_id = brawler612's_id`
3. Assigns all forms created by these users to their account

## How It Works

### For Admins (Account Owners)
1. When an admin creates a form, it's automatically assigned to their account
2. Only admins in the same account can see, edit, or delete forms in that account
3. Admins can share forms with other users or accounts using the sharing API
4. Only the form creator or account admins can manage permissions

### For Regular Users
1. Users can see public forms (account_id = NULL)
2. Users can see forms explicitly shared with them
3. Users cannot create forms (role limitation)
4. Users cannot modify form permissions

### For Anonymous Users
1. Cannot see any forms
2. Can still submit forms if they have the form link and form is accessible

## Security Considerations

1. **Account Isolation**: Forms are isolated by account_id, ensuring admins from different accounts cannot access each other's forms
2. **Permission Checking**: All form operations (get, update, delete) verify the user has access
3. **Form Sharing**: Explicit permission records are required for cross-account access
4. **Audit Logging**: All form operations are logged with user and action details

## Frontend Changes

No frontend changes were required as the API already passes authorization headers. The frontend will:
1. Automatically respect form filtering based on user's account
2. Display only forms the user has access to
3. Prevent form operations for users without permissions (403 errors)

## Database Update Instructions

To implement these changes in an existing database:

1. Run the updated `init-database.sql` to recreate the database with new schema
2. OR manually run these SQL commands:

```sql
-- Add columns to users table
ALTER TABLE users ADD COLUMN account_id INT NULL AFTER role;
ALTER TABLE users ADD COLUMN is_account_owner BOOLEAN DEFAULT FALSE AFTER account_id;
ALTER TABLE users ADD FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD INDEX idx_account_id (account_id);

-- Add column to forms table
ALTER TABLE forms ADD COLUMN account_id INT NULL AFTER created_by;
ALTER TABLE forms ADD FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE forms ADD INDEX idx_account_id (account_id);

-- Create form_permissions table
CREATE TABLE form_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_id INT NOT NULL,
  user_id INT NULL,
  account_id INT NULL,
  permission_type ENUM('view', 'edit', 'admin') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_form_user_permission (form_id, user_id),
  UNIQUE KEY unique_form_account_permission (form_id, account_id),
  INDEX idx_form_id (form_id),
  INDEX idx_user_id (user_id),
  INDEX idx_account_id (account_id)
);

-- Run the migration script
node migrate-accounts.js
```

## Testing the Implementation

1. **Create an account owner and user**:
   - Use the existing users: brawler612@gmail.com (admin) and jushuapeterte@gmail.com (user)

2. **Run migration**:
   ```bash
   cd backend
   node migrate-accounts.js
   ```

3. **Test form access**:
   - Admin logs in and creates a form → Form is assigned to admin's account
   - Other admins cannot see this form
   - Regular user can see the form if shared
   - Anonymous users cannot see the form

4. **Test form sharing**:
   - Admin shares form with another account/user
   - Other account/user can now access the form

## Future Enhancements

1. Add UI for managing form permissions
2. Support for form collaboration within accounts
3. Role-based permissions (view, edit, admin)
4. Audit trail for permission changes
5. Form templates and organization
