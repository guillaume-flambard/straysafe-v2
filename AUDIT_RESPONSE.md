# StraySafe – Beta Launch Readiness Plan

> This document outlines all the necessary tasks to complete before releasing the **public beta version** of the StraySafe mobile app. Tasks are organized by priority and impact.

---

## 🔥 Top Priority – Must Be Completed Before Beta

### 1. Push Notifications
- **Status:** Infrastructure in place, but incomplete
- **Missing:**
  - Device token registration and storage
  - Notification sending logic (currently commented out)
- **Action Required:**
  - Enable token handling per user/device
  - Activate push triggers (e.g., new message, dog status update)

---

### 2. Privacy Settings Integration
- **Status:** UI controls exist but not connected to database
- **Missing:**
  - RLS rules enforcing privacy
  - UI state binding to database flags
- **Action Required:**
  - Ensure user-defined privacy preferences are stored in Supabase
  - Apply row-level access rules accordingly

---

### 3. User Onboarding Flow
- **Status:** Not implemented
- **Missing:**
  - Guided tutorial for new users
  - First-login walkthrough
- **Action Required:**
  - Add onboarding carousel or modal (React Native)
  - Highlight core features: dog tracking, messaging, event creation

---

### 4. Image Upload Completion
- **Status:** Image picker works
- **Missing:**
  - Upload to Supabase Storage
  - Image compression & optimization
- **Action Required:**
  - Finish storage logic
  - Add resizing (e.g., via Expo ImageManipulator or Sharp in backend)

---

### 5. Deploy Staging Environment
- **Status:** Missing
- **Action Required:**
  - Create a staging Supabase project
  - Configure a test deployment using Expo EAS or a dev build channel
  - Seed with demo users and test dogs

---

## ⚠️ Medium Priority – Recommended for Smooth Beta

### 6. Offline Support (Minimum Viable)
- **Status:** No offline capability
- **Action Required:**
  - Cache critical data (e.g., dog list, last messages) using AsyncStorage or SQLite
  - Display notice when user is offline

---

### 7. Performance Optimization
- **Issues:**
  - Long lists not virtualized
  - Heavy image rendering
- **Action Required:**
  - Use FlashList or FlatList with virtualization for performance
  - Apply lazy-loading and memoization

---

### 8. Error Handling & UI Feedback
- **Issues:**
  - Missing error boundaries on some screens
  - Incomplete loader/fallback states
- **Action Required:**
  - Add visual feedback for API loading states
  - Use `ErrorBoundary` wrappers or conditionals

---

## ✅ Optional / Nice-to-Have for Beta

### 9. Minimal Analytics
- **Status:** Not implemented
- **Recommendation:**
  - Integrate lightweight analytics (e.g., PostHog, Amplitude)
  - Track: session start, dog events, messages sent

---

### 10. In-App Feedback Collection
- **Status:** Not available
- **Recommendation:**
  - Add a feedback button (e.g., send to a Notion form or email)
  - Allow screenshot or message submission for bug reports

---

## 🧪 Checklist Summary

| Task                              | Priority | Status    |
|-----------------------------------|----------|-----------|
| Push notifications                | High     | ⏳ Incomplete |
| Privacy settings (DB + RLS)       | High     | ⏳ Incomplete |
| User onboarding tutorial          | High     | ❌ Not started |
| Image upload pipeline             | High     | ⏳ Partial |
| Staging deployment                | High     | ❌ Not started |
| Offline support (basic caching)   | Medium   | ❌ Not started |
| Virtualization & perf tuning      | Medium   | ⏳ Partial |
| Error boundaries & loaders        | Medium   | ⏳ Partial |
| Basic analytics                   | Low      | ❌ Not started |
| Feedback form                     | Low      | ❌ Not started |

---

## 📦 Dependencies
- React Native + Expo
- Supabase (PostgreSQL, Auth, Storage, RLS)
- React Query
- Expo Push Notifications
- AsyncStorage or SQLite (for offline caching)

---

## ✨ Goal
Release a stable and usable **beta version** of StraySafe that:
- Functions reliably in the field
- Enables clear feedback loops
- Demonstrates core value (dog tracking, messaging, collaboration)

---

_Last updated: 2025-07-23_