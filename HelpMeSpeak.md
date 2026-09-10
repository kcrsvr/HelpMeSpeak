# Help Me Speak

## Design 

HelpMeSpeak — Complete Vision Document
App Name: HelpMeSpeak

Core Purpose: A communication aid app for non-verbal autistic children. Helps them express needs and learn words through pictures, audio, and animated spelling.

Dual Mode Design
Child Mode

Home screen: Featured/favorite words at top (caregiver-picked + auto-filled by most used) + category tiles below
4 bottom tabs: Home, Categories, Favorites (= Featured), Settings (PIN-locked)
Grid density: Default 2 per row, caregiver can adjust to 3 or 4
Word experience: Full screen takeover — picture enlarges → audio plays → letters spell out one by one (each letter enlarges + highlights at 0.8s default, caregiver-adjustable, synced to audio) → confetti burst (balloons, glitter, paper streamers) → large "Again?" button → tap back to return
Word experience background: Solid color from active theme
No quizzes, purely expressive
Positive reinforcement: Confetti on every word tap
Accessibility: 80x80px min tap targets, iOS Switch Control support, high contrast theme
Caregiver Mode

PIN-protected (4-digit, reset via email)
Completely different UI — dark/professional admin feel
Dashboard: Child profile cards at top + quick action buttons below
Add New Word: Guided step-by-step wizard (photo/video → record audio with playback/re-record → type word → assign category → set as featured) + "Save & Add Another"
"Preview as Child" button to test any word/category as child will see it
Adjustable settings per child: grid density, spelling speed (slow/medium/fast), sensory settings (animation, volume), TTS on/off
Profile picker screen: caregiver can enable/disable on app launch
Content
Pre-loaded categories: Food, Drink, Toilet, Sleep, Pain/Hurt, Feelings, People (Mom, Dad, Teacher, Friend, Doctor), Places, Activities

Images: Real photographs by default, caregiver replaces with personal familiar photos

Audio: Caregiver records per word (tap to record → instant playback → approve or redo). TTS fallback if no recording exists (caregiver can disable TTS). One language per word for v1, data model ready for multi-language later.

Visual Design Language
Typography: Rounded friendly font for UI, bold high-contrast for spelling animation
Themes (4 presets, per child profile):
Calm Blue — soft sky blues, white
Sunny Yellow — warm yellows, orange accents
Nature Green — earthy greens, warm neutrals
High Contrast — black/white/yellow
Sensory: Minimal safe defaults (no auto-play, tap-triggered only) + full caregiver control per child
Logo: To be decided after UI is established
Onboarding (First Launch)
3-step intro: Child Mode intro → Caregiver Mode intro → Set PIN

Storage
Hybrid: Fully offline on device + optional iCloud/Google Drive backup

Prototype Scope (iPhone 16 HTML)
8 screens, fully clickable, all animations simulated in CSS, audio simulated visually:

Splash screen
3-step onboarding
Child Mode home
Category grid screen
Full-screen word experience
Caregiver Mode home
Add New Word wizard
Settings screen
Future Roadmap
Progress tracking (which words used most, growth reports)
Sentence building (I want + water + please)
Social sharing (share vocabulary set with therapist/school)
Therapist/teacher stakeholder flows
Multi-language audio per word



## Tasks

Implementation Plan — HelpMeSpeak HTML Prototype
Problem Statement: Build a single, self-contained HTML file that is a full clickable prototype of HelpMeSpeak for iPhone 16, covering both Child Mode and Caregiver Mode across 8 screens.

Requirements: As gathered across 15 rounds — dual mode app, non-verbal children, picture→audio→spelling experience, confetti, 4 themes including "Rohit", caregiver PIN-protected admin, guided word wizard, hybrid offline, full clickable flow.

Proposed Solution: One HelpMeSpeak.html file. All screens as <div> sections, JavaScript handles screen transitions. CSS custom properties power the 4 theme system. CSS keyframe animations handle spelling and confetti. Web Speech API simulates audio with a visual "speaking" indicator. iPhone 16 frame (393×852px) centered on desktop, full screen on mobile.

Task Breakdown:

Task 1: Project foundation — theme system and CSS scaffold

Single HTML file, iPhone 16 viewport (393×852px)
CSS custom properties for all 4 themes: --color-primary, --color-accent, --color-bg, --color-text, --color-card
Calm Blue, Rohit (yellow/red), Nature Green, High Contrast
Rounded friendly font (Google Fonts: Nunito) for UI, bold font for spelling
Base layout: full-height screen containers, hidden by default, JS showScreen() function
Demo: All 4 themes switchable via a temporary theme toggle button, colors update live across the page
Task 2: Splash screen + 3-step onboarding

Splash: HelpMeSpeak logo text, tagline, animated pulse, auto-advances after 2s
Onboarding Step 1: Child Mode intro — big friendly illustration placeholder, description
Onboarding Step 2: Caregiver Mode intro — icon, description
Onboarding Step 3: Set PIN — 4-digit PIN pad, confirm PIN, "Let's Go" button
Progress dots at bottom of each onboarding step
Demo: Tap through splash → 3 onboarding steps → lands on Child Mode home
Task 3: Child Mode home screen

App header: HelpMeSpeak logo + child profile avatar (top right) + theme color background
"Featured" section: horizontal scroll row of 6 large word cards (real emoji as photo placeholder + word label)
"Categories" section: 2-column grid of category tiles (Food 🍎, Feelings 😊, People 👨‍👩‍👧, Places 🏠, Activities 🎮, Drink 💧, Toilet 🚽, Sleep 😴)
Bottom nav: 4 tabs — Home, Categories, Favorites, Settings (with icons)
Demo: Home screen fully rendered in all 4 themes, bottom nav tabs are tappable
Task 4: Category grid screen

Back button (← Food) in header
Category title + emoji
2-column picture grid (default), each card: photo placeholder + word label below
Cards are large, rounded, with theme-colored border on tap
Demo: Tap "Food" category from home → see Food grid with Apple, Banana, Water, Milk, Rice, Bread, etc.
Task 5: Full-screen word experience

Triggered by tapping any picture card
Phase 1: Picture enlarges with smooth scale animation (center of screen)
Phase 2: Audio simulated — animated sound wave bars + "Speaking…" label
Phase 3: Word spelling — each letter appears one by one, current letter enlarges (1.5x) + highlights in accent color, others in muted color. Default 0.8s per letter.
Phase 4: Confetti burst — CSS keyframe animation, balloons 🎈, glitter ✨, paper streamers in theme colors rain down
Phase 5: Large "Again? 🔁" button appears — replays from Phase 1. Small "← Back" in corner
Background: solid theme primary color
Demo: Tap "Apple" → full experience plays end to end, Again button replays it
Task 6: Caregiver Mode home

Accessed via Settings tab → PIN entry screen (4-digit pad)
On correct PIN: switches to dark professional UI (dark gray/slate background, white text)
Persistent "Caregiver Mode" badge in header + "Exit to Child Mode" button
Child profile cards: photo avatar, child name, last active, "Manage" button
Quick action buttons: ➕ Add New Word, 📂 Manage Categories, 📊 View Activity, ⚙️ Settings
Demo: Enter PIN from settings → Caregiver Mode home renders in dark UI
Task 7: Add New Word guided wizard

Step 1: Upload Photo — large dashed upload area, tap to "select" (simulated), preview appears
Step 2: Record Audio — big red record button, tap to start, tap to stop, waveform animation while recording, playback button, re-record option
Step 3: Type the Word — large text input, character count
Step 4: Assign Category — grid of category chips to tap-select
Step 5: Set as Featured? — toggle switch + confirmation summary card showing all entered data
"Save & Add Another" + "Save & Done" buttons at Step 5
Progress bar at top showing current step (1 of 5)
Demo: Walk through all 5 steps, reach confirmation summary, tap Save
Task 8: Settings screen + full navigation wiring

Settings screen (Child Mode): Theme picker (4 theme cards, tap to apply live), PIN change, child profile management, TTS toggle, spelling speed (slow/medium/fast slider), grid density (2/3/4 per row)
Wire ALL navigation: every back button, every tab, every flow connects correctly
"Preview as Child" button in Caregiver Mode returns to Child Mode temporarily
Ensure iPhone 16 safe areas (notch/dynamic island top, home bar bottom) are respected with padding
Final polish: consistent spacing, touch targets all ≥80px, smooth screen transitions (slide or fade)
Demo: Full end-to-end walkthrough — splash → onboarding → child home → category → word experience → settings → caregiver mode → add word → back to child mode


## Design Considerations

- Full Decision Summary
Dimension	Decision
- Users	One caregiver account per family, 1+ children
- Devices	Many devices per family, all sync
- Offline	Everything works offline — child + caregiver modes
- Sync speed	Real-time when online
- Media	S3, smart-cached to active devices
- Conflicts	Last write wins
- Deletion	Hard delete
- Auth	Sign in with Apple + Google
- Privacy	GDPR + COPPA, encrypted, no child data shared
- Device security	App caregiver PIN + phone lock screen
- Analytics	Anonymous aggregate only
- Mobile	Bare React Native (iOS + Android)
- Backend	AWS — manual console setup
- API	REST — API Gateway + Lambda
- Database	DynamoDB
- Media storage	S3 direct
- Sync mechanism	AWS SNS push notifications
- Local storage	SQLite (expo-sqlite)
- Sync engine	Timestamp-based (updatedAt)
- Auth service	AWS Cognito
- Deployment	Manual AWS console
- Distribution	App Store + Play Store
- Web (MVP)	Marketing site only
- Desktop	Phase 2
- Team	Solo / very small
- Budget	$50-200/month
- MVP features	Child Mode, Caregiver Mode, cloud sync, offline, auth, 3 child profiles, pre-loaded content



---

# HelpMeSpeak — Application Architecture

> Document version: 1.0 | Date: September 2026
> Status: Approved for implementation

---

## 1. System Overview

HelpMeSpeak is an offline-first, cloud-synced communication aid app for non-verbal autistic children. It runs on iOS and Android (React Native), with data backed by AWS. The system is designed so that **no data is ever lost** — every change made on any device, online or offline, is eventually persisted to the cloud and propagated to all other devices in the family.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FAMILY ECOSYSTEM                             │
│                                                                     │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐             │
│   │  Child iPad │   │  Mom iPhone │   │  Dad iPhone │  ...devices  │
│   │             │   │             │   │             │             │
│   │ React Native│   │ React Native│   │ React Native│             │
│   │  SQLite DB  │   │  SQLite DB  │   │  SQLite DB  │             │
│   │  Local S3   │   │  Local S3   │   │  Local S3   │             │
│   │   Cache     │   │   Cache     │   │   Cache     │             │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘             │
│          │                 │                  │                     │
└──────────┼─────────────────┼──────────────────┼─────────────────────┘
           │                 │                  │
           │    HTTPS / REST API calls          │
           │    + SNS Push Notifications        │
           ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS CLOUD                                   │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Amazon     │  │   AWS        │  │   Amazon S3              │  │
│  │   Cognito    │  │   API        │  │                          │  │
│  │              │  │   Gateway    │  │  /media/{accountId}/     │  │
│  │  Auth &      │  │              │  │    photos/               │  │
│  │  Identity    │  │  REST API    │  │    audio/                │  │
│  │              │  │  endpoints   │  │                          │  │
│  └──────────────┘  └──────┬───────┘  └──────────────────────────┘  │
│                           │                                         │
│                    ┌──────▼───────┐                                 │
│                    │  AWS Lambda  │                                 │
│                    │  Functions   │                                 │
│                    │  (Node.js)   │                                 │
│                    └──────┬───────┘                                 │
│                           │                                         │
│              ┌────────────┼────────────┐                            │
│              ▼            ▼            ▼                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │   DynamoDB   │ │  Amazon SNS  │ │  Amazon SES  │                │
│  │              │ │              │ │              │                │
│  │  App data    │ │  Push notif  │ │  Email       │                │
│  │  (words,     │ │  sync alerts │ │  (future     │                │
│  │  categories, │ │  to devices  │ │   use)       │                │
│  │  profiles)   │ │              │ │              │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Client Architecture — React Native App

### 2.1 Layer Structure

```
┌─────────────────────────────────────────────┐
│              PRESENTATION LAYER             │
│                                             │
│  Child Mode Screens   Caregiver Mode Screens│
│  ├── Home             ├── Dashboard         │
│  ├── Category Grid    ├── Add Word Wizard   │
│  ├── Word Experience  ├── Manage Categories │
│  ├── Favorites        ├── Settings          │
│  └── Settings         └── Child Profiles   │
├─────────────────────────────────────────────┤
│              STATE MANAGEMENT               │
│                                             │
│   Redux Toolkit (or Zustand for solo dev)   │
│   ├── authSlice    (user session)           │
│   ├── profileSlice (active child)           │
│   ├── wordsSlice   (word/category data)     │
│   ├── settingsSlice (theme, speed, grid)    │
│   └── syncSlice   (pending changes queue)  │
├─────────────────────────────────────────────┤
│              OFFLINE DATA LAYER             │
│                                             │
│   expo-sqlite / SQLite                      │
│   ├── words table                           │
│   ├── categories table                      │
│   ├── profiles table                        │
│   ├── settings table                        │
│   └── sync_queue table (pending uploads)   │
├─────────────────────────────────────────────┤
│              SYNC ENGINE                    │
│                                             │
│   SyncManager (runs on reconnect + SNS)     │
│   ├── Push local changes (updatedAt based)  │
│   ├── Pull remote changes                   │
│   ├── Resolve conflicts (last write wins)   │
│   └── Update local SQLite after sync       │
├─────────────────────────────────────────────┤
│              NETWORK LAYER                  │
│                                             │
│   REST API Client (Axios)                   │
│   ├── Auth endpoints (Cognito)              │
│   ├── Words / Categories CRUD              │
│   ├── Profiles CRUD                        │
│   └── Media upload / download (S3)         │
├─────────────────────────────────────────────┤
│              DEVICE SERVICES               │
│                                             │
│   ├── Camera / Photo Library               │
│   ├── Microphone (audio recording)         │
│   ├── Text-to-Speech (fallback)            │
│   ├── Push Notifications (SNS)             │
│   └── Network state monitor               │
└─────────────────────────────────────────────┘
```

### 2.2 Offline-First Flow

```
User taps "Add Word" in Caregiver Mode
           │
           ▼
  ┌─────────────────┐
  │  Write to local  │  ← Always succeeds immediately
  │  SQLite first    │    regardless of connectivity
  │  (status=pending)│
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐       Online?
  │  SyncManager    │──YES──────────────────────┐
  │  checks network │                           │
  └─────────────────┘                           ▼
           │ NO                      ┌─────────────────────┐
           ▼                         │  POST to Lambda API │
  ┌─────────────────┐                │  Upload photo to S3 │
  │  Stays in       │                │  Update DynamoDB    │
  │  sync_queue     │                └──────────┬──────────┘
  │  table          │                           │
  └─────────────────┘                           ▼
           │                         ┌─────────────────────┐
           │ Device comes online     │  Lambda sends SNS   │
           └────────────────────────▶│  notification to    │
                                     │  all family devices │
                                     └──────────┬──────────┘
                                                │
                                                ▼
                                     ┌─────────────────────┐
                                     │  Other devices      │
                                     │  receive push notif │
                                     │  → pull changes     │
                                     │  → update SQLite    │
                                     │  → UI refreshes     │
                                     └─────────────────────┘
```

---

## 3. AWS Backend Architecture

### 3.1 Services Used

| AWS Service | Purpose | Why |
|---|---|---|
| **Amazon Cognito** | Authentication — Sign in with Apple & Google, user pools, JWT tokens | Managed auth, handles social login federation, free tier covers MVP |
| **API Gateway** | REST API — all app ↔ backend communication | Serverless, scales to zero, pay per request |
| **AWS Lambda** | Business logic — Node.js functions behind each API endpoint | No servers to manage, cold start acceptable for this use case |
| **DynamoDB** | Primary database — all app data | Serverless, scales infinitely, ~$0 at MVP scale |
| **Amazon S3** | Media storage — photos and audio recordings | Durable, cheap, direct upload from device |
| **Amazon SNS** | Push notifications — sync alerts to devices | Triggers real-time sync across family devices |
| **CloudWatch** | Logging and monitoring | Free tier sufficient for MVP |

### 3.2 API Endpoints

```
Authentication
  POST   /auth/login              Cognito token exchange
  POST   /auth/refresh            Refresh JWT token
  DELETE /auth/logout             Invalidate session

Profiles (Children)
  GET    /accounts/{id}/profiles         List all child profiles
  POST   /accounts/{id}/profiles         Create child profile
  PUT    /accounts/{id}/profiles/{pid}   Update child profile
  DELETE /accounts/{id}/profiles/{pid}   Delete child profile

Categories
  GET    /profiles/{pid}/categories         List all categories
  POST   /profiles/{pid}/categories         Create category
  PUT    /profiles/{pid}/categories/{cid}   Update category
  DELETE /profiles/{pid}/categories/{cid}   Delete category

Words
  GET    /profiles/{pid}/words              List all words
  POST   /profiles/{pid}/words             Create word
  PUT    /profiles/{pid}/words/{wid}       Update word
  DELETE /profiles/{pid}/words/{wid}       Delete word

Media
  POST   /media/upload-url        Get pre-signed S3 URL for upload
  GET    /media/download-url      Get pre-signed S3 URL for download

Sync
  POST   /sync/push               Push batch of local changes
  GET    /sync/pull?since={ts}    Pull all changes since timestamp
  GET    /sync/status             Check if device is up to date
```

### 3.3 Lambda Function Map

```
┌─────────────────────────────────────────────────────────┐
│                    LAMBDA FUNCTIONS                     │
│                                                         │
│  auth-handler         → Cognito token validation       │
│  profile-handler      → CRUD for child profiles        │
│  category-handler     → CRUD for categories            │
│  word-handler         → CRUD for words + media refs    │
│  media-handler        → S3 pre-signed URL generation   │
│  sync-handler         → Push/pull sync logic           │
│  notification-handler → SNS dispatch after mutations   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Data Model

### 4.1 DynamoDB Table Design

DynamoDB uses a single-table design pattern — one table, multiple entity types, partition key = accountId, sort key = entity type + ID.

```
Table name: helpmespeak-data

PK (partition)          SK (sort)                  Attributes
─────────────────────── ────────────────────────── ─────────────────────────────
ACCOUNT#{accountId}     ACCOUNT#{accountId}         email, plan, createdAt
ACCOUNT#{accountId}     PROFILE#{profileId}         name, avatar, theme, settings, updatedAt
ACCOUNT#{accountId}     CATEGORY#{profileId}#{cid}  name, emoji, color, order, updatedAt
ACCOUNT#{accountId}     WORD#{profileId}#{wid}      word, categoryId, photoKey, audioKey,
                                                     isFeatured, ttsEnabled, updatedAt
ACCOUNT#{accountId}     SYNC#{deviceId}             lastSyncAt, deviceName, platform
```

### 4.2 Entity Schemas

**Account**
```json
{
  "accountId": "acc_abc123",
  "email": "parent@example.com",
  "authProvider": "apple | google",
  "createdAt": "2026-09-05T10:00:00Z",
  "plan": "free | premium"
}
```

**Child Profile**
```json
{
  "profileId": "prof_xyz789",
  "accountId": "acc_abc123",
  "name": "Rohit",
  "avatarEmoji": "👦",
  "theme": "rohit",
  "spellingSpeed": "medium",
  "gridSize": 2,
  "ttsEnabled": true,
  "showProfilePicker": false,
  "createdAt": "2026-09-05T10:00:00Z",
  "updatedAt": "2026-09-05T10:00:00Z"
}
```

**Category**
```json
{
  "categoryId": "cat_001",
  "profileId": "prof_xyz789",
  "accountId": "acc_abc123",
  "name": "Food",
  "emoji": "🍎",
  "color": "#E74C3C",
  "order": 1,
  "isBuiltIn": true,
  "createdAt": "2026-09-05T10:00:00Z",
  "updatedAt": "2026-09-05T10:00:00Z"
}
```

**Word**
```json
{
  "wordId": "word_001",
  "profileId": "prof_xyz789",
  "accountId": "acc_abc123",
  "categoryId": "cat_001",
  "word": "Apple",
  "photoKey": "media/acc_abc123/photos/word_001.jpg",
  "photoType": "real | emoji",
  "audioKey": "media/acc_abc123/audio/word_001.m4a",
  "audioType": "recorded | tts",
  "isFeatured": true,
  "order": 1,
  "usageCount": 47,
  "lastUsedAt": "2026-09-05T10:00:00Z",
  "createdAt": "2026-09-05T10:00:00Z",
  "updatedAt": "2026-09-05T10:00:00Z"
}
```

**Local SQLite sync_queue table (device only)**
```sql
CREATE TABLE sync_queue (
  id          TEXT PRIMARY KEY,
  entity_type TEXT,     -- 'word' | 'category' | 'profile'
  entity_id   TEXT,
  operation   TEXT,     -- 'create' | 'update' | 'delete'
  payload     TEXT,     -- JSON blob of the change
  created_at  INTEGER,  -- Unix timestamp
  status      TEXT      -- 'pending' | 'syncing' | 'failed'
);
```

---

## 5. Sync Engine Design

### 5.1 Timestamp-Based Sync

Every entity has an `updatedAt` field. The device tracks its last successful sync timestamp in the `SYNC#{deviceId}` record.

```
ON RECONNECT or ON SNS NOTIFICATION RECEIVED:

1. PUSH LOCAL CHANGES
   - Query sync_queue WHERE status = 'pending'
   - POST /sync/push with batch of changes
   - Lambda writes each to DynamoDB
   - Lambda sends SNS notification to all other devices
   - Mark queue items as 'synced', clear queue

2. PULL REMOTE CHANGES
   - GET /sync/pull?since={lastSyncAt}
   - Lambda queries DynamoDB for all items
     WHERE updatedAt > lastSyncAt AND accountId = this account
   - Merge into local SQLite
   - Conflict rule: if remoteUpdatedAt > localUpdatedAt → use remote
   - Update lastSyncAt = now

3. MEDIA SYNC
   - For each word with photoKey / audioKey not yet cached locally:
     - GET /media/download-url for that key
     - Download from S3 to local file system
     - Cache reference in SQLite
```

### 5.2 Network State Manager

```
App launch → check network state
     │
     ├── ONLINE  → run full sync immediately
     │
     └── OFFLINE → load from local SQLite, show "Offline" indicator
                   register listener for network reconnection
                   on reconnection → run full sync
```

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
User opens app
      │
      ▼
  Sign in with Apple / Google
      │
      ▼
  Cognito receives social token
  Cognito issues JWT (id + access + refresh tokens)
      │
      ▼
  App stores tokens securely
  (iOS Keychain / Android Keystore via react-native-keychain)
      │
      ▼
  All API calls include:
  Authorization: Bearer {accessToken}
      │
      ▼
  API Gateway validates JWT via Cognito authorizer
  Lambda receives verified accountId from token claims
  Lambda only returns data WHERE accountId = token.accountId
```

### 6.2 Data Security Layers

| Layer | Protection |
|---|---|
| **Transit** | HTTPS/TLS 1.3 on all API calls and S3 transfers |
| **At rest — DynamoDB** | AWS managed encryption (AES-256) enabled by default |
| **At rest — S3** | Server-side encryption (SSE-S3) on all media files |
| **At rest — device** | iOS Data Protection / Android file encryption on SQLite and cached media |
| **Token storage** | iOS Keychain / Android Keystore — never AsyncStorage |
| **S3 access** | Pre-signed URLs only — no public bucket, no direct access |
| **API access** | Every Lambda validates accountId — no cross-account data access possible |
| **Caregiver PIN** | Stored as bcrypt hash in local SQLite — never in cloud |

### 6.3 COPPA + GDPR Compliance

- No advertising SDKs — ever
- No behavioral tracking of children
- No child data leaves the family account
- Anonymous aggregate analytics only (total word counts, popular categories across all users — no individual identification)
- Data deletion: account deletion triggers Lambda to purge all DynamoDB records and S3 media for that accountId
- Privacy policy clearly states: child photos and audio recordings are stored encrypted and never accessed by HelpMeSpeak

---

## 7. Media Architecture

### 7.1 Upload Flow (Caregiver adds a photo)

```
Caregiver selects photo on device
      │
      ▼
App calls POST /media/upload-url
      │
      ▼
Lambda generates pre-signed S3 PUT URL
S3 key = media/{accountId}/{profileId}/photos/{wordId}.jpg
      │
      ▼
App uploads directly from device to S3
(bypasses Lambda — faster, cheaper)
      │
      ▼
App calls POST /words with photoKey reference
Lambda writes word record to DynamoDB
Lambda triggers SNS notification
      │
      ▼
Other devices receive SNS → pull new word
→ download photo from S3 to local cache
```

### 7.2 Smart Caching Strategy

```
Child's active device (iPad):
  → All words + photos + audio pre-downloaded
  → Full offline capability
  → Cache refreshed on every sync

Caregiver's device (iPhone):
  → Metadata (word list, categories) always synced
  → Media downloaded on demand / when on WiFi
  → Thumbnails cached, full audio on tap

Priority download order:
  1. Featured words (home screen) — always cached first
  2. Most recently used words
  3. All other words by category
```

---

## 8. MVP Scope & Delivery Plan

### 8.1 MVP Feature Set

| Feature | Priority | Notes |
|---|---|---|
| Child Mode — full word experience | P0 | Picture + audio + spelling + confetti |
| Caregiver Mode — add/edit/delete words | P0 | 5-step wizard |
| Caregiver Mode — manage categories | P0 | Including create new category |
| Per-child profiles (up to 3) | P0 | Name, theme, settings |
| 4 color themes including Rohit | P0 | Per child profile |
| Pre-loaded content — 10 categories | P0 | Food, Drink, Feelings, People, etc. |
| Sign in with Apple + Google | P0 | Via AWS Cognito |
| Cloud sync across all devices | P0 | DynamoDB + SNS |
| Full offline support | P0 | SQLite + sync queue |
| Photo upload from camera/library | P0 | S3 pre-signed upload |
| Audio recording + TTS fallback | P0 | Per word |
| Push notification sync | P0 | SNS to all family devices |
| Caregiver PIN protection | P0 | Local bcrypt hash |
| COPPA + GDPR compliance | P0 | Non-negotiable |

### 8.2 MVP Build Sequence

```
PHASE 0 — Foundation (Weeks 1-3)
  ├── React Native project setup (bare workflow)
  ├── AWS Cognito — Sign in with Apple + Google
  ├── DynamoDB table created with schema
  ├── S3 bucket with encryption + IAM policies
  ├── API Gateway + first Lambda (health check)
  └── Local SQLite schema + basic CRUD

PHASE 1 — Core Child Experience (Weeks 4-7)
  ├── Child Mode screens (from HTML prototype)
  ├── Word experience (enlarge + audio + spelling + confetti)
  ├── 4 themes + Rohit theme
  ├── Pre-loaded content (10 categories)
  ├── Audio playback + TTS fallback
  └── Works fully offline from SQLite

PHASE 2 — Caregiver Mode (Weeks 8-11)
  ├── PIN-protected caregiver mode
  ├── Add New Word wizard (photo + audio + word + category)
  ├── Manage categories (create, edit, delete)
  ├── Child profile management (up to 3 profiles)
  └── Settings (theme, speed, grid, TTS)

PHASE 3 — Cloud Sync (Weeks 12-15)
  ├── All CRUD operations wired to Lambda APIs
  ├── S3 photo/audio upload flow
  ├── Timestamp-based sync engine
  ├── SNS push notification integration
  ├── Offline queue + reconnect sync
  └── Multi-device testing

PHASE 4 — Polish + Launch (Weeks 16-18)
  ├── App Store submission (iOS)
  ├── Play Store submission (Android)
  ├── Privacy policy + terms of service
  ├── Marketing website (static HTML/CSS)
  ├── Beta testing with real families
  └── Bug fixes + performance pass
```

### 8.3 Estimated AWS Cost at MVP Scale

| Service | Usage assumption | Monthly cost |
|---|---|---|
| DynamoDB | < 1M reads/writes/month | ~$2 |
| Lambda | < 1M invocations/month | ~$0 (free tier) |
| API Gateway | < 1M calls/month | ~$3 |
| S3 storage | 10 GB media storage | ~$0.25 |
| S3 transfer | 5 GB download/month | ~$0.45 |
| Cognito | < 50,000 MAU | ~$0 (free tier) |
| SNS | < 1M notifications | ~$0.50 |
| CloudWatch | Basic logging | ~$1 |
| **Total** | | **~$7–15/month** |

Well within the $50-200/month budget. Leaves room to add CloudFront CDN, ElasticSearch, or RDS in Phase 2 without hitting budget ceiling.

---

## 9. Long-Term Roadmap (Phase 2 and Beyond)

### Phase 2 — Growth Features (Months 5-8 post-launch)

| Feature | Description |
|---|---|
| **Progress Tracking** | Caregiver dashboard — which words used most, weekly growth charts, exportable PDF report for therapists |
| **Sentence Builder** | Child taps multiple pictures to form "I want + water + please" — basic AAC sentence strip |
| **CloudFront CDN** | Add CDN in front of S3 — faster media loading for international families |
| **Desktop app** | Electron wrapper around the React Native web build — Mac + Windows |
| **Backup + Export** | Caregiver can export full word library as ZIP (photos + audio + JSON) |
| **Therapist sharing** | Share a child's vocabulary set with a therapist via a secure read-only link |

### Phase 3 — Scale Features (Months 9-14 post-launch)

| Feature | Description |
|---|---|
| **Multi-language audio** | Multiple audio recordings per word (English + Tamil, etc.) — data model already supports this |
| **Video support** | Caregiver can record a short video for a word instead of just a photo |
| **School/organization accounts** | Multi-child, multi-therapist accounts. Shared vocabulary libraries. |
| **AI photo suggestions** | When caregiver types a word, suggest royalty-free photos automatically |
| **RDS PostgreSQL** | Add relational database alongside DynamoDB for complex progress analytics queries |
| **Wearable / TV support** | Apple Watch quick-access words, Apple TV for classroom display mode |

### Phase 4 — Platform Maturity (Month 15+)

| Feature | Description |
|---|---|
| **Premium subscription** | Free: 3 profiles, 50 words. Premium: unlimited. Via in-app purchase (RevenueCat) |
| **Therapist marketplace** | Verified speech therapists can publish vocabulary packs — families install with one tap |
| **Offline AI TTS** | On-device neural TTS that sounds like a child — no internet needed for voice |
| **Research partnerships** | Anonymized aggregate data (opt-in) shared with autism research institutions |

---

## 10. Key Architecture Decisions & Rationale

| Decision | Rationale |
|---|---|
| **Offline-first with SQLite** | Network is unreliable. Child must always be able to use the app. Data must never be lost. SQLite ensures this unconditionally. |
| **Single-table DynamoDB** | At MVP scale with a solo developer, single-table is simpler to manage, cheaper, and query patterns are well-defined |
| **Pre-signed S3 URLs** | Media uploads bypass Lambda — faster uploads, lower Lambda cost, no 6MB Lambda payload limit |
| **SNS for sync triggers** | Battery-efficient vs. polling. Device is not woken up unless there is actual new data |
| **Last-write-wins conflicts** | Family app — two caregivers editing the same word simultaneously is extremely rare. Complexity of conflict UI not justified at MVP |
| **Bare React Native** | Full control over native modules — critical for audio recording quality, file system access, and future deep accessibility features (Switch Control) |
| **bcrypt PIN locally** | Caregiver PIN never leaves the device. Even if cloud is compromised, PIN cannot be extracted |
| **Hard delete** | Simplicity wins at MVP. Soft delete adds complexity (filtering deleted items from all queries). Can revisit in Phase 2. |

---

## 11. Repository Structure (Recommended)

```
helpmespeak/
├── mobile/                     React Native app
│   ├── src/
│   │   ├── screens/
│   │   │   ├── child/          Child mode screens
│   │   │   └── caregiver/      Caregiver mode screens
│   │   ├── components/         Shared UI components
│   │   ├── store/              Redux/Zustand state
│   │   ├── db/                 SQLite schema + queries
│   │   ├── sync/               SyncManager engine
│   │   ├── api/                REST API client (Axios)
│   │   ├── audio/              Recording + playback
│   │   ├── theme/              4 color themes
│   │   └── utils/
│   ├── android/
│   ├── ios/
│   └── package.json
│
├── backend/                    AWS Lambda functions
│   ├── functions/
│   │   ├── auth-handler/
│   │   ├── profile-handler/
│   │   ├── category-handler/
│   │   ├── word-handler/
│   │   ├── media-handler/
│   │   ├── sync-handler/
│   │   └── notification-handler/
│   ├── shared/                 Shared utilities (auth validation, DynamoDB client)
│   └── package.json
│
├── web/                        Marketing website
│   ├── index.html
│   ├── style.css
│   └── assets/
│
└── docs/
    ├── HelpMeSpeak.md          This document
    └── HelpMeSpeak.html        UI prototype
```

---

*Document maintained by: HelpMeSpeak team*
*Last updated: September 2026*
*Next review: After MVP Phase 0 completion*
