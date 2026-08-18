# UMKMify Architecture

## Technology Stack

### Frontend
- React 19 + Vite 6
- Tailwind CSS v4 (`@tailwindcss/vite`)
- React Router (routing)
- Axios (HTTP client)
- Framer Motion (animation)

### Backend
- Laravel 12 (PHP 8.5)
- Laravel Sanctum (SPA / token auth)

### Database
- MySQL 8.4 (InnoDB, utf8mb4)
- Schema: `umkmify.sql` is the single source of truth (see `Schema.md`)
- Laravel migrations are intentionally not used

### Deployment
- Vercel — frontend (`FrontEnd/vercel.json`)
- Railway — backend (`BackEnd/railway.json`, `BackEnd/nixpacks.toml`)

### Version Control
- Git
- GitHub

Repository:
https://github.com/S4toD4yo/UMKMify.git