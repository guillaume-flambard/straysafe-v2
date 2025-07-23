# StraySafe v2

A React Native app for tracking and managing stray dogs, built with Expo, Supabase, and TypeScript.

## ✨ Features

- 🐕 **Dog Management** - Track, register, and manage stray dog profiles
- 📱 **Cross-Platform** - iOS, Android, and Web support
- 🔐 **Authentication** - Secure user auth with role-based permissions
- 📍 **Location Services** - GPS tracking and location-based features
- 💬 **Real-time Messaging** - Communication between users and volunteers
- 🏥 **Medical Records** - Track medical events and health status
- 📊 **Event Logging** - Comprehensive timeline of dog-related activities
- 🔔 **Push Notifications** - Real-time updates and alerts
- 🎨 **Modern UI** - Clean, intuitive interface with dark/light themes
- 🔒 **Privacy Controls** - User privacy settings and data management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- [Bun](https://bun.sh) (recommended) or npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g @expo/cli`
- [Supabase](https://supabase.com) account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/guillaume-flambard/straysafe-v2.git
   cd straysafe-v2
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run migrations: `supabase/migrations/*.sql` (in order)
   - Seed with test data: `bun run seed` (if available)

5. **Start Development Server**
   ```bash
   bun run start
   # or npm start
   ```

6. **Demo Credentials**
   ```
   Email: admin@straysafe.org
   Password: password
   ```

## 📁 Project Structure

```
straysafe-v2/
├── app/                    # Expo Router pages & navigation
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── chat/              # Messaging interface
│   ├── settings/          # User settings
│   └── ...
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks & state management
├── lib/                    # Third-party configurations (Supabase, tRPC)
├── services/               # Business logic & API services
├── supabase/              # Database schema & migrations
│   ├── migrations/        # Database migrations
│   └── dev-scripts/       # Development utilities
├── types/                  # TypeScript definitions
├── utils/                  # Helper functions
└── constants/             # App constants
```

## 🛠 Development

### Available Scripts

```bash
bun run start          # Start Expo development server
bun run android        # Start on Android
bun run ios           # Start on iOS
bun run web           # Start web version
```

### Code Quality

- **TypeScript** - Full type safety
- **ESLint** - Code linting (if configured)
- **Git Hooks** - Pre-commit checks (if configured)

### Branch Strategy

- `main` - Production-ready code
- `feature/*` - Feature development
- `connect-database` - Database integration
- `implement-signup` - Authentication features

## 🗄 Database Schema

### Core Tables
- **users** - User authentication & profiles
- **profiles** - Extended user information & privacy settings
- **locations** - Geographic locations & regions
- **dogs** - Dog records with medical & status info
- **dog_events** - Timeline of dog-related activities
- **conversations** - Message threads between users
- **messages** - Individual messages with real-time sync
- **notifications** - Push notification records

### Key Features
- **Row Level Security (RLS)** - Data access control
- **Real-time subscriptions** - Live data updates
- **File storage** - Image uploads for dogs & users
- **Full-text search** - Advanced search capabilities

## 🏗 Tech Stack

### Frontend
- **React Native** - Mobile framework
- **Expo** - Development platform & deployment
- **TypeScript** - Type safety
- **Expo Router** - File-based navigation
- **@expo/vector-icons** - Icon library
- **React Query** - Server state management

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication & user management
  - Real-time subscriptions
  - File storage
  - Row Level Security

### Development Tools
- **Bun** - Package manager & runtime
- **tRPC** - Type-safe API layer
- **Zustand** - Client state management

## 🚢 Deployment

### Expo Application Services (EAS)

1. **Setup EAS CLI**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Build for Production**
   ```bash
   eas build --platform all
   ```

3. **Submit to App Stores**
   ```bash
   eas submit --platform all
   ```

### Web Deployment

```bash
bun run web
# Build static files for hosting
```

## 🧪 Testing

- Manual testing workflows in development
- Database testing with Supabase local development
- Cross-platform testing on iOS/Android/Web

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use existing component patterns
- Maintain database migrations properly
- Test on multiple platforms
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@straysafe.org
- 🐛 Issues: [GitHub Issues](https://github.com/guillaume-flambard/straysafe-v2/issues)
- 📖 Documentation: [Project Wiki](https://github.com/guillaume-flambard/straysafe-v2/wiki)

## 🙏 Acknowledgments

- Built with ❤️ for stray animal welfare
- Powered by [Expo](https://expo.dev) & [Supabase](https://supabase.com)
- Icons by [@expo/vector-icons](https://icons.expo.fyi)

---

**Made with 🐕 for helping stray animals find safe homes**