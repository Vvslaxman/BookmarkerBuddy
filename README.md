# Bookmarker - Modern Bookmark Management System

A comprehensive bookmark management application built with Next.js and secure authentication. Efficiently organize, search, and manage your digital bookmarks with advanced analytics and tagging capabilities.

## Live Demo

Check out the live demo: [dApp - Supply Chain Decentralization](https://cometforge-production.up.railway.app/)

![Image](mainpage.png)

## Features

- 🔐 Secure user authentication
- 📚 Efficient bookmark organization
- 🏷️ Advanced tagging system
- 🔍 Powerful search functionality
- 📊 Bookmark analytics and insights
- 🎨 Modern glassmorphic design
- 📱 Responsive layout for all devices

## Tech Stack

- **Frontend**: Next.js, React Query, Tailwind CSS, shadcn/ui
- **Backend**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js
- **API**: RESTful architecture

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/username/bookmarker.git
cd bookmarker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/bookmarker
PORT=5000
```

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Bookmarks
- `GET /api/bookmarks` - Get all bookmarks
- `POST /api/bookmarks` - Create new bookmark
- `PATCH /api/bookmarks/:id` - Update bookmark
- `DELETE /api/bookmarks/:id` - Delete bookmark
- `GET /api/bookmarks/search` - Search bookmarks
- `GET /api/bookmarks/stats` - Get bookmark statistics

### Tags
- `POST /api/tags/suggest` - Get AI-powered tag suggestions

## Development

### Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── pages/
├── server/
│   ├── routes.ts
│   ├── storage.ts
│   └── auth.ts
└── shared/
    └── schema.ts
```

### Database Schema

```typescript
// Bookmark Schema
{
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags").array().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
  lastModifiedAt: timestamp("last_modified_at").notNull().defaultNow(),
  accessCount: integer("access_count").notNull().default(0)
}
```

## Deployment

The application is configured to be deployed on Replit:

1. Fork the project on Replit
2. Add the required environment variables in Replit's Secrets tab
3. The application will automatically build and deploy

Alternatively, for other platforms:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com) for the beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team) for the database ORM
- [TanStack Query](https://tanstack.com/query) for data fetching

## Contact

For any questions or suggestions, please open an issue or contact [Vvslaxman](mailto:vvslaxman14@gmail.com).
