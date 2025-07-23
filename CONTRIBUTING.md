# Contributing to StraySafe v2

Thank you for your interest in contributing to StraySafe! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/straysafe-v2.git
   cd straysafe-v2
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Update with your Supabase credentials
   ```

4. **Database Setup**
   - Create a Supabase project
   - Run migrations in order from `supabase/migrations/`
   - Use test data from `supabase/seed_*.sql`

## 🏗 Development Workflow

### Branch Strategy

- `main` - Production-ready code (protected)
- `feature/feature-name` - New features
- `fix/issue-description` - Bug fixes
- `docs/documentation-update` - Documentation changes

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Follow existing code patterns
   - Add TypeScript types for new code
   - Test on multiple platforms (iOS/Android/Web)

3. **Commit Guidelines**
   ```bash
   git commit -m "type: brief description"
   ```
   
   **Commit Types:**
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `style:` - Code style/formatting
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Code Standards

### TypeScript

- **Always use TypeScript** - No `.js` files in `app/`, `components/`, `hooks/`
- **Define proper types** - Create interfaces for all data structures
- **Use strict mode** - Follow `tsconfig.json` settings
- **Export types** - Make types reusable across files

```typescript
// ✅ Good
interface Dog {
  id: string;
  name: string;
  status: DogStatus;
  location?: Location;
}

// ❌ Avoid
const dog = {
  id: "123",
  name: "Buddy"
  // Missing types
};
```

### React Native Components

- **Functional Components** - Use hooks instead of class components
- **Proper Props** - Define interfaces for all component props
- **Consistent Styling** - Use StyleSheet.create()
- **Responsive Design** - Consider different screen sizes

```typescript
// ✅ Good
interface DogCardProps {
  dog: Dog;
  onPress: (dog: Dog) => void;
}

export default function DogCard({ dog, onPress }: DogCardProps) {
  return (
    <Pressable style={styles.container} onPress={() => onPress(dog)}>
      <Text style={styles.name}>{dog.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
});
```

### Database Changes

- **Always use migrations** - No direct schema changes
- **Maintain RLS policies** - Security first approach
- **Document changes** - Update schema comments
- **Test with sample data** - Verify queries work

```sql
-- ✅ Good migration structure
-- Migration: 20250723000001_add_dog_tags.sql

-- Add new column
ALTER TABLE dogs 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Update RLS policy if needed
ALTER POLICY dogs_select_policy ON dogs 
USING (auth.uid() = user_id OR is_volunteer(auth.uid()));

-- Add comment
COMMENT ON COLUMN dogs.tags IS 'Array of tags for categorizing dogs';
```

## 🎨 UI/UX Guidelines

### Design Principles

- **Accessibility First** - Support screen readers, proper contrast
- **Consistent Spacing** - Use standardized padding/margins
- **Platform Conventions** - Follow iOS/Android design patterns
- **Performance** - Optimize images, minimize re-renders

### Color Usage

```typescript
// Use constants/colors.ts
import Colors from '@/constants/colors';

// ✅ Consistent colors
backgroundColor: Colors.card,
color: Colors.text,

// ❌ Avoid hardcoded colors
backgroundColor: '#ffffff',
color: '#000000',
```

### Icons

```typescript
// ✅ Use @expo/vector-icons
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="heart" size={24} color={Colors.primary} />
```

## 🗄 Database Contributions

### Schema Changes

1. **Create Migration File**
   ```
   supabase/migrations/YYYYMMDDHHMMSS_description.sql
   ```

2. **Follow Migration Pattern**
   - One logical change per migration
   - Include rollback instructions in comments
   - Test with existing data

3. **Update Types**
   ```typescript
   // Update types/index.ts
   export interface Dog {
     id: string;
     name: string;
     tags: string[]; // New field
   }
   ```

### RLS Policies

- **Secure by default** - Deny all, then allow specific cases
- **Role-based access** - Use helper functions like `is_admin()`
- **Performance aware** - Avoid complex joins in policies

## 🧪 Testing

### Manual Testing Checklist

- [ ] iOS simulator/device
- [ ] Android emulator/device  
- [ ] Web browser (Chrome, Safari, Firefox)
- [ ] Different screen sizes
- [ ] Network conditions (offline, slow)
- [ ] User roles (admin, volunteer, regular user)

### Database Testing

```sql
-- Test your changes with different user contexts
SET session_replication_role = replica;
INSERT INTO auth.users (id, email) VALUES ('test-user-id', 'test@example.com');
SET session_replication_role = DEFAULT;

-- Verify RLS policies work
SELECT * FROM dogs; -- Should respect permissions
```

## 🚀 Pull Request Process

### Before Submitting

- [ ] Code follows project conventions
- [ ] TypeScript compiles without errors
- [ ] Manual testing completed
- [ ] Database migrations tested
- [ ] Documentation updated if needed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Tested on Web
- [ ] Database changes tested

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Related Issues
Closes #123
```

### Review Process

1. **Automated Checks** - TypeScript, basic validation
2. **Code Review** - Maintainer review for quality
3. **Testing** - Manual verification on multiple platforms
4. **Merge** - Squash and merge to main

## 📚 Resources

### Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Development Tools

- **VS Code Extensions**
  - React Native Tools
  - TypeScript Importer
  - Expo Tools
  - ESLint (if configured)

### Learning Resources

- [React Native Tutorial](https://reactnative.dev/docs/tutorial)
- [Expo Router Guide](https://expo.github.io/router/docs/)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

## 🤝 Community

### Communication

- **GitHub Issues** - Bug reports, feature requests
- **GitHub Discussions** - General questions, ideas
- **Email** - security@straysafe.org (security issues only)

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers get started
- Respect maintainer decisions

## 🙋 Getting Help

### Common Issues

1. **Metro bundler cache issues**
   ```bash
   bunx expo start --clear
   ```

2. **iOS build problems**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Database connection issues**
   - Check `.env` credentials
   - Verify Supabase project status
   - Check network connectivity

### Where to Ask

- **Stack Overflow** - Tag with `react-native`, `expo`, `supabase`
- **GitHub Issues** - Project-specific problems
- **Expo Discord** - Real-time community help
- **Supabase Discord** - Database-related questions

---

**Thank you for contributing to StraySafe! Together we're helping stray animals find safe homes. 🐕❤️**