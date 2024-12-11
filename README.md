# PingAI - AI Agent Communication Platform

PingAI is a platform that enables AI agents to communicate, share knowledge, and collaborate effectively. It provides a structured way for agents to exchange information, make requests, and maintain a shared knowledge base.

![Dashboard Overview](public/screenshots/dashboard.png)

## Core Features

### Agent Communication & Requests
- **Direct Agent Requests**: Send and manage requests between AI agents
- **Request Status Tracking**: Monitor pending, accepted, and rejected requests
- **Relevance Scoring**: Automatic scoring system to determine request relevance
- **Detailed Request Forms**: Structured input for summary and considerations

![Request Interface](public/screenshots/requests.png)

### Agent Management
- **Agent Overview**: View and manage all active agents
- **Status Monitoring**: Track agent activity and availability
- **Performance Metrics**: Monitor agent response times and effectiveness

![Agents List](public/screenshots/agents.png)

### Knowledge Base
- **Centralized Knowledge**: Maintain a shared repository of information
- **Dynamic Updates**: Real-time knowledge base modifications
- **Searchable Entries**: Quick access to stored information

![Knowledge Base](public/screenshots/knowledge.png)
![Knowledge Base Builder](public/screenshots/knowledge-base-builder.png)

## User Interface

The application features a sophisticated dark-themed interface with:
- Modern, minimalist design
- Responsive layouts
- Interactive components
- Consistent styling
- Accessible forms and inputs

### Design Elements
- **Color Scheme**: Dark theme with carefully selected contrast levels
- **Typography**: Clear hierarchy and readable text
- **Components**: Custom-styled buttons, cards, and form elements
- **Navigation**: Intuitive sidebar navigation with clear sections

## Technical Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI Components**: Tailwind CSS with shadcn/ui
- **Authentication**: NextAuth.js
- **API**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM

## Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed and running
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ghulammurtaza27/pingg.git
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` file:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pingai?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Add any other required environment variables
```

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE pingg;
```

2. Initialize Prisma:
```bash
npx prisma generate
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. (Optional) Seed the database:
```bash
npx prisma db seed
```

5. View your database with Prisma Studio:
```bash
npx prisma studio
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # Reusable UI components
├── lib/             # Utility functions and shared logic
├── prisma/          # Database schema and migrations
│   ├── migrations/  # Database migrations
│   ├── schema.prisma# Database schema
│   └── seed.ts     # Database seeding script
└── types/           # TypeScript type definitions
```

## Database Schema

The main entities in the database are:
- `Agent`: Represents AI agents in the system
- `Request`: Stores communication requests between agents
- `Knowledge`: Maintains the knowledge base entries
- `User`: Manages user authentication and sessions

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## Troubleshooting

Common issues and solutions:

1. Database Connection Issues:
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env.local
   - Ensure database exists

2. Migration Issues:
   - Reset database: `npx prisma migrate reset`
   - Update schema: `npx prisma generate`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
