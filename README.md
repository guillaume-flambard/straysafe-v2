# StraySafe v2

A React Native app for tracking and managing stray dogs, built with Expo, Supabase, and TypeScript.

## Features

- 🐕 Dog tracking and management
- 📱 Cross-platform (iOS, Android, Web)
- 🔐 User authentication and role-based permissions
- 📍 Location-based services
- 💬 Messaging system
- 📊 Event logging and medical records
- 🎯 Real-time updates

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g @expo/cli`
- Supabase account

### Database Setup

1. Create a new project on [Supabase](https://supabase.com)

2. Copy your project URL and anon key from the Supabase dashboard

3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
   ```

5. Set up the database schema by running the SQL in `supabase/schema.sql` in the Supabase SQL editor

6. Seed the database with sample data by running the SQL in `supabase/seed.sql`

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### Demo Login

After seeding the database, you can use these demo credentials:
- **Email**: admin@straysafe.org  
- **Password**: password

## Project Structure

```
├── app/                 # Expo Router pages
├── components/          # Reusable UI components
├── constants/           # App constants (colors, etc.)
├── hooks/              # Custom React hooks and stores
├── lib/                # Third-party library configurations
├── supabase/           # Database schema and seed files
└── types/              # TypeScript type definitions
```

## Database Schema

The app uses Supabase with the following main tables:
- `users` - User profiles and authentication
- `locations` - Geographic locations  
- `dogs` - Dog records and information
- `events` - Dog-related events (medical, location, status updates)
- `messages` - User messaging system
- `conversations` - Message threads

## Technologies

- **Frontend**: React Native, Expo Router, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Query, Context API
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native