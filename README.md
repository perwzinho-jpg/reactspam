# ES Turbo (ReactSpam) Project

This repository contains both backend and frontend code for the ES Turbo WhatsApp marketing platform.

## Backend Setup

- The backend lives under `backend/` and is a Node.js/Express application using MySQL.
- Database schema is defined in `backend/src/config/database.sql`.

### Environment Variables

| Variable       | Description                                                                 | Example             |
|----------------|-----------------------------------------------------------------------------|---------------------|
| `JWT_SECRET`   | Secret key for signing JWT tokens                                           | `supersecret`       |
| `JWT_EXPIRE`   | Token expiration (e.g. `7d`, `24h`)                                        | `7d`                |
| `DB_HOST`      | MySQL host                                                                  | `localhost`         |
| `DB_USER`      | MySQL user                                                                  | `root`              |
| `DB_PASSWORD`  | MySQL password                                                              |                     |
| `DB_NAME`      | Database name (usually `es_turbo`)                                          | `es_turbo`          |
| `ADMIN_CODE`   | *Optional.* a secret string that allows creating additional administrators  | `letmein`           |


### Admin account creation

- **First registered user is automatically made an admin**. When the users table contains no records with `account_type = 'admin'`, the very first registration action will produce an administrator account.
- To create further admin accounts, supply an `adminCode` field in the registration payload which must match the value of `ADMIN_CODE` in your environment.
  ```json
  POST /api/auth/register
  {
    "username": "adminuser",
    "email": "admin@example.com",
    "password": "password123",
    "adminCode": "letmein"
  }
  ```
- Alternatively you can promote an existing user via SQL:
  ```sql
  UPDATE users SET account_type = 'admin' WHERE id = 1;
  ```

### Useful commands

```bash
cd backend
npm install

# create or update database schema (requires MySQL running)
npm run init-db

# start development server
npm run dev
```

### Default administrator

When you run `npm run init-db` it will also insert a default administrator
account if the users table contains no admin yet. The credentials are taken
from environment variables (or fall back to these defaults):

```dotenv
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=password123
DEFAULT_ADMIN_FULLNAME="Administrator"
```

> **Please change the password after first login.**

You can inspect existing users with a SQL query in phpMyAdmin or the
MySQL CLI:

```sql
SELECT id, username, email, account_type FROM users;
```

or promote any user to admin manually:

```sql
UPDATE users SET account_type = 'admin' WHERE id = 1;
```


## Frontend Setup

(…existing documentation…)  


---

> ⚠️ **Security note:** keep `ADMIN_CODE` secret! If leaked, anyone with it could register as an administrator.
