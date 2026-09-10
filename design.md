# HelpMeSpeak — Simplified Architecture (Design)

> Document version: 2.0 | Date: September 2026
> Status: Proposed — supersedes the AWS REST/SNS architecture in HelpMeSpeak.md §1–10
> Author: architecture review

---

## 0. Why this rewrite

The v1 architecture (API Gateway + 7 Lambdas + DynamoDB + SNS + a hand-rolled
timestamp sync engine) is a lot of moving parts for a **solo developer building
an offline-first family app with maybe a few thousand users**. Most of that
plumbing exists to solve two problems:

1. CRUD over a database (words, categories, profiles).
2. Push a change made on one device to the other devices in the same family in
   near real time.

**AWS AppSync solves both of those out of the box.** It is a managed GraphQL
service that talks directly to DynamoDB (no Lambda needed for basic CRUD) and
has **real-time subscriptions built in over WebSockets** — which is exactly the
"tell the other family devices something changed" job that SNS was doing.

The rest of this document is the simplified design and a side-by-side of what
changes.

---

## 1. What changes vs. v1

| Concern | v1 (current) | v2 (proposed) | Why simpler |
|---|---|---|---|
| API surface | API Gateway REST + 7 Lambda handlers | **AppSync GraphQL API** | One managed endpoint, no route/Lambda wiring |
| CRUD logic | Lambda functions per entity | **AppSync → DynamoDB resolvers** (VTL/JS, no Lambda) | Direct data-source resolvers, nothing to deploy/maintain |
| Real-time sync | SNS push notifications + custom `/sync/pull` polling logic | **AppSync GraphQL subscriptions** (WebSocket) | Real-time is a first-class feature; no push infra, no device tokens |
| Sync engine | Hand-written `SyncManager` + `sync_queue` + `/sync/push` + `/sync/pull` | **Amplify DataStore** (offline-first + auto conflict resolution) | Offline queue, sync, and conflict resolution are handled by the SDK |
| Auth | Cognito | **Cognito** (unchanged) | Already the right choice; AppSync integrates natively |
| Media | S3 + pre-signed URLs via Lambda | **S3 + Amplify Storage** (pre-signed handled by SDK) | Same S3, no custom media Lambda |
| Conflict resolution | Manual "last write wins" in Lambda | **DataStore conflict detection** (auto-merge / LWW configurable) | Built in, versioned |
| Deployment | Manual AWS console clicks across 7+ services | **Amplify CLI** (`amplify push`) or a single CDK stack | One reproducible deploy |

**Net effect:** we delete API Gateway, all 7 Lambdas, SNS, the custom sync
endpoints, and the entire client-side `SyncManager`/`sync_queue` code. We keep
Cognito, DynamoDB, and S3 — the actual data stores — and let AppSync + Amplify
DataStore be the glue.

---

## 2. Should we use AppSync? — recommendation

**Yes, for the sync + API layer. This is the single biggest simplification.**

AppSync fits this app almost perfectly:

- **Real-time is the hard requirement, and it's free with AppSync.** The whole
  reason SNS was in v1 was "when Mom edits a word on her phone, the child's iPad
  should see it." A GraphQL `subscription` on the family's data does this with
  zero extra infrastructure. When a device runs a mutation, AppSync
  automatically pushes it to every other subscribed device.
- **Offline-first is the *other* hard requirement, and Amplify DataStore is
  built for it.** DataStore keeps a local queryable store (SQLite under the
  hood on RN), lets the app read/write while offline, and syncs automatically
  when the network returns — including conflict resolution. This replaces the
  entire hand-rolled `sync_queue` + timestamp-merge engine in v1 §5.
- **No servers, matches the solo-dev + $50–200/mo constraint.** AppSync is
  pay-per-request and has a generous free tier. DynamoDB and S3 stay as-is.
- **It still uses DynamoDB.** We are not throwing away the data model — AppSync
  resolvers map onto the same DynamoDB table(s). The §4 data model largely
  survives.

### Honest tradeoffs (so this is a real decision, not a sales pitch)

- **DataStore's data model is opinionated.** It works best with a table
  **per model** (Word, Category, Profile) rather than the v1 single-table
  design. For this app's scale, per-model tables are actually *simpler* to
  reason about and cost effectively nothing. I recommend dropping single-table
  design (see §4).
- **GraphQL learning curve** if you've only done REST — but you write far less
  code overall, and Amplify generates the schema, resolvers, and typed client.
- **Conflict resolution is "auto" but has rules.** Default is "Auto Merge";
  you can set it to "Optimistic Concurrency" or a custom Lambda. For a family
  app, **Auto Merge or last-writer-wins is fine** and matches the v1 decision.
- **Some custom server logic still wants a Lambda.** Account deletion (purge all
  data + S3 media for COPPA/GDPR) and any "send email" work are better as a
  small Lambda resolver or a DynamoDB-stream-triggered Lambda. So Lambda doesn't
  vanish entirely — it shrinks from 7 functions to ~1.

### When AppSync would be the *wrong* call

- If you needed complex, multi-table transactional business logic on every
  write — you don't here.
- If the team were REST-committed with existing REST tooling — you're greenfield.

For HelpMeSpeak, AppSync is the right level of abstraction. It removes the two
most complex, most bug-prone parts of v1 (the sync engine and the push
pipeline) and replaces them with managed features.

---

## 3. Simplified system overview

```
┌───────────────────────────────────────────────────────────────┐
│                        FAMILY DEVICES                          │
│   Child iPad · Mom iPhone · Dad iPhone  (React Native)         │
│                                                                │
│   ┌──────────────────────────────────────────────────────┐   │
│   │  Amplify DataStore                                     │   │
│   │   • Local store (SQLite) — offline-first reads/writes  │   │
│   │   • Auto sync queue + conflict resolution              │   │
│   │   • GraphQL subscriptions → live updates from family   │   │
│   └───────────────────────┬──────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────┘
                            │  GraphQL over HTTPS + WebSocket
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                          AWS CLOUD                             │
│                                                                │
│   ┌──────────────┐        ┌───────────────────────────────┐   │
│   │  Amazon      │        │        AWS AppSync            │   │
│   │  Cognito     │◀──auth──│  GraphQL API                 │   │
│   │  (Apple/     │        │   • Queries / Mutations       │   │
│   │   Google)    │        │   • Real-time Subscriptions   │   │
│   └──────────────┘        │   • Direct DynamoDB resolvers │   │
│                           └───────┬───────────────────────┘   │
│                                   │                            │
│              ┌────────────────────┼───────────────────┐       │
│              ▼                    ▼                   ▼       │
│      ┌──────────────┐   ┌──────────────┐   ┌───────────────┐ │
│      │  DynamoDB    │   │  Amazon S3   │   │ Lambda (×1)   │ │
│      │  Word /      │   │  photos /    │   │ account-purge │ │
│      │  Category /  │   │  audio       │   │ (COPPA/GDPR)  │ │
│      │  Profile     │   │  (Amplify    │   │  + optional   │ │
│      │  tables      │   │   Storage)   │   │  email        │ │
│      └──────────────┘   └──────────────┘   └───────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

Compare to v1's diagram: API Gateway, SNS, and 6 of the 7 Lambdas are gone.

---

## 4. Data model (adjusted for AppSync/DataStore)

Move from v1 single-table DynamoDB to **one DynamoDB table per model** — this is
what Amplify generates and it keeps resolvers trivial. Every model is scoped to
an `accountId` (the family) and protected by an owner/group auth rule so no
family can read another's data.

### GraphQL schema (source of truth — Amplify generates the tables)

```graphql
type Account @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  email: String!
  authProvider: String        # "apple" | "google"
  plan: String                # "free" | "premium"
  profiles: [Profile] @hasMany
}

type Profile @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  accountId: ID! @index(name: "byAccount")
  name: String!
  avatarEmoji: String
  theme: String               # "calm-blue" | "rohit" | "nature-green" | "high-contrast"
  spellingSpeed: String       # "slow" | "medium" | "fast"
  gridSize: Int               # 2 | 3 | 4
  ttsEnabled: Boolean
  showProfilePicker: Boolean
  categories: [Category] @hasMany
  words: [Word] @hasMany
}

type Category @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  profileId: ID! @index(name: "byProfile")
  accountId: ID!
  name: String!
  emoji: String
  color: String
  order: Int
  isBuiltIn: Boolean
}

type Word @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  profileId: ID! @index(name: "byProfile")
  accountId: ID!
  categoryId: ID! @index(name: "byCategory")
  word: String!
  photoKey: String            # S3 key (Amplify Storage)
  photoType: String           # "real" | "emoji"
  audioKey: String
  audioType: String           # "recorded" | "tts"
  isFeatured: Boolean
  order: Int
  usageCount: Int
  lastUsedAt: AWSDateTime
}
```

Notes:
- `@model` → Amplify creates the DynamoDB table + AppSync CRUD + subscriptions.
- `@auth(allow: owner)` → row-level security tied to the Cognito user; replaces
  the "every Lambda validates accountId" rule in v1 §6.1.
- `@index` → replaces manual GSI design; used for "all words in a profile", etc.
- DataStore adds `_version`, `_lastChangedAt`, `_deleted` fields automatically —
  these power conflict resolution and replace the v1 `updatedAt` bookkeeping and
  the `sync_queue` table entirely.

**Caregiver PIN stays local only** (bcrypt in the device's SQLite / Keychain).
It is *not* a model — never syncs to the cloud. Unchanged from v1 §6.2.

---

## 5. Sync & offline (now mostly free)

v1 had a whole section (§5) for a custom sync engine. In v2 this collapses to
**"use Amplify DataStore"**:

```
Caregiver taps "Add Word"
        │
        ▼
DataStore.save(word)         ← writes to local SQLite immediately (offline OK)
        │
        ├── offline → queued automatically by DataStore
        │
        └── online  → DataStore syncs via AppSync mutation
                          │
                          ▼
                   AppSync writes DynamoDB
                          │
                          ▼
                   AppSync pushes subscription event
                          │
                          ▼
             Other family devices' DataStore receive it
             → local store updated → UI re-renders (observeQuery)
```

- **Offline queue:** built in. No `sync_queue` table to design or debug.
- **Conflict resolution:** built in. Configure the AppSync API with `Auto Merge`
  (recommended) or `Optimistic Concurrency`. Matches v1's "last write wins"
  intent without custom code.
- **Live UI:** screens subscribe with `DataStore.observeQuery(Word)` and update
  automatically when any device changes data.

---

## 6. Media (essentially unchanged, less code)

Photos and audio still live in **S3**. Instead of a `media-handler` Lambda
minting pre-signed URLs, use **Amplify Storage**:

```
uploadData({ key: `photos/${wordId}.jpg`, data: file })   // upload
getUrl({ key: word.photoKey })                             // pre-signed download URL
```

Amplify Storage handles pre-signed URLs, per-user access scoping (`private/`
prefix keyed to the Cognito identity), and SSE. The smart-caching strategy from
v1 §7.2 still applies at the app layer (pre-download featured words, etc.).

---

## 7. Security (same guarantees, less to hand-build)

- **Transit:** HTTPS/WSS everywhere (AppSync + S3).
- **Auth:** Cognito with Sign in with Apple + Google (unchanged).
- **Row-level access:** `@auth(allow: owner)` enforced by AppSync — a family can
  only ever read/write its own rows. Replaces the manual accountId checks.
- **At rest:** DynamoDB (AES-256) and S3 (SSE) encryption, on by default.
- **Media access:** Amplify Storage `private` access level → per-identity scoped,
  no public bucket.
- **Caregiver PIN:** local bcrypt only, never synced.
- **COPPA/GDPR account deletion:** the one remaining Lambda (`account-purge`)
  deletes all of a family's DynamoDB rows + S3 objects on account deletion.

---

## 8. What Lambda is still for

Down from 7 functions to essentially **one**:

| Function | Trigger | Why it can't be a plain resolver |
|---|---|---|
| `account-purge` | AppSync mutation or Cognito pre-deletion | Cross-table fan-out delete + S3 cleanup for compliance |
| *(optional)* `email` | DynamoDB stream / mutation | If/when transactional email (PIN reset) is added |

Everything else (word/category/profile CRUD, plus all sync and push) is handled
by AppSync directly.

---

## 9. Deployment

Replace "manual AWS console setup across 7 services" with **Amplify CLI**:

```
amplify init
amplify add auth          # Cognito + Apple/Google
amplify add api           # AppSync + the GraphQL schema above (DynamoDB tables)
amplify add storage       # S3 for media
amplify add function       # account-purge Lambda
amplify push              # provisions everything, reproducibly
```

One command deploys the whole backend, and it's version-controlled in the repo.
(A CDK stack is an equally valid alternative if you prefer infra-as-code over
Amplify's tooling.)

---

## 10. Cost (still tiny)

| Service | Assumption | Monthly |
|---|---|---|
| AppSync | < 1M queries + < 1M real-time updates | ~$4 (mostly free tier) |
| DynamoDB | < 1M R/W | ~$2 |
| S3 (10 GB + 5 GB transfer) | | ~$0.70 |
| Cognito | < 50k MAU | ~$0 (free tier) |
| Lambda (1 fn, rare) | | ~$0 |
| CloudWatch | basic | ~$1 |
| **Total** | | **~$5–10/mo** |

Same ballpark as v1, but with far fewer services to operate and no push
infrastructure to keep alive.

---

## 11. Migration notes (for the v1 doc)

If you adopt this, the following sections of `HelpMeSpeak.md` change:

- **§3.1 Services Used** — remove API Gateway, SNS; change "AWS Lambda (7 fns)"
  to "AppSync + 1 Lambda".
- **§3.2 API Endpoints** — replaced by the GraphQL schema in §4 here.
- **§3.3 Lambda Function Map** — collapses to `account-purge`.
- **§5 Sync Engine** — replaced by Amplify DataStore (§5 here).
- **§4 Data Model** — move from single-table to per-model tables (§4 here).
- **§6.1 Auth Flow** — Cognito authorizer on AppSync instead of API Gateway;
  `@auth` rules replace per-Lambda accountId checks.
- **§10 decisions** — "SNS for sync triggers" and "single-table DynamoDB" are
  reversed; add "AppSync + DataStore for sync/API".

The client repo structure (§11) also simplifies: `src/sync/` and `src/api/` are
mostly deleted — DataStore is the API and the sync engine.

---

## 12. Summary of the recommendation

1. **Adopt AWS AppSync** as the single API + real-time layer. This is the core
   simplification and directly answers "SNS/AWS seems overkill."
2. **Adopt Amplify DataStore** on the client — delete the custom sync engine and
   `sync_queue`. Offline + conflict resolution come for free.
3. **Keep** Cognito, DynamoDB, S3 — they were the right choices.
4. **Delete** API Gateway, SNS, and 6 of 7 Lambdas.
5. **Switch** DynamoDB from single-table to per-model tables (Amplify default).
6. **Deploy** with Amplify CLI instead of manual console clicks.

Result: same features (offline-first, real-time family sync, secure, cheap),
roughly half the AWS surface area, and dramatically less custom sync/push code
to write and maintain.
