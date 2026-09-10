# HelpMeSpeak — Phased Build Roadmap

> A solo-dev sequencing plan optimized for risk, not calendar. Each phase ships something a real family can use. You can stop, pause, or gather feedback at any phase boundary without a half-built system.

## Guiding Principle

The app's value is the **child experience** — picture → audio → spelling → confetti. The cloud is a convenience feature, not the product. Prove the thing that matters most to real families first, defer the cloud as long as possible, and only build backend once you've earned the right to.

This deliberately flips the risk order of the v1 plan (§8.2), which front-loads AWS setup and defers the child experience and sync to later phases. Here, infrastructure comes *after* the product is proven and shippable.

---

## Phase 0 — Validate With What You Already Have

**Duration:** Days, not weeks
**Goal:** De-risk the entire product before writing a line of React Native.

You already have a working HTML prototype. Put it in front of real users before building anything.

### Deliverables
- 2–3 observed sessions with caregivers of non-verbal autistic children, using the existing HTML prototype.
- Written notes on what worked and what broke: spelling speed, confetti intensity, category ordering, audio expectations, overall interaction model.
- A prioritized list of changes to fold into Phase 1.

### Definition of Done
- At least 2 real caregiver + child sessions completed and observed directly.
- Interaction-model risks documented (e.g. "confetti overstimulates," "spelling too fast").
- A go/no-go decision on the core interaction model, plus a concrete change list for Phase 1.

---

## Phase 1 — Local-Only App, No Cloud (The Real MVP)

**Goal:** A shippable, genuinely useful product for a single family on one device. No AWS, no auth, no sync.

This is where most of your real risk lives — audio recording quality, offline behavior, accessibility, Switch Control. Nailing the data model locally now makes later schema changes far cheaper.

### Deliverables
- **Child Mode:** full word experience (picture → audio → spelling → confetti), 4 themes, pre-loaded content.
- **Caregiver Mode:** PIN lock, add/edit words, record audio, manage categories, manage profiles.
- **Storage:** local SQLite (`expo-sqlite`) or AsyncStorage + device file system for media.
- A validated local data model designed close to the eventual GraphQL `@model` shapes (see Cross-Phase Coupling below).

### Definition of Done
- A single family can use the app fully offline, indefinitely, on one device.
- Audio record + playback works reliably; media persists across app restarts.
- Accessibility basics verified, including Switch Control navigation.
- Data model is stable and documented — considered "the source of truth" before any cloud work.

---

## Phase 2 — Single-User Cloud: Auth + Backup

**Goal:** "My data survives if I lose my phone." One device, one direction. Prove the pipeline with low stakes — **not** multi-device yet.

### Deliverables
- **Cognito** auth: Sign in with Apple + Google.
- **AppSync + DynamoDB + S3** provisioned via Amplify.
- **Amplify DataStore** wired to the models validated in Phase 1.
- One-device backup/restore flow proven end to end.

### Definition of Done
- A user can sign in, back up their data to the cloud, and restore it onto a fresh install.
- DataStore's schema opinions have been reconciled with the Phase 1 model with no rewrite.
- Media (audio/images) round-trips through S3 correctly.

---

## Phase 3 — Multi-Device Real-Time Sync

**Goal:** Turn on the feature that justified AppSync — Mom edits a word, the child's iPad updates live. This is the phase most likely to surprise you, which is exactly why it comes after the app is proven and shippable.

### Deliverables
- DataStore subscriptions across family devices.
- A chosen and tested conflict-resolution strategy (Auto Merge or Last-Writer-Wins).
- Media caching / smart pre-download for the child's device.

### Definition of Done
- An edit on one device appears on a second physical device in near real time.
- Sync behaves correctly across flaky networks and airplane-mode transitions (tested on two physical devices).
- Conflict resolution behaves predictably under concurrent edits.

---

## Phase 4 — Compliance, Polish, Launch

**Goal:** Get it into families' hands, cleanly and legally. Kids-category apps get extra scrutiny.

### Deliverables
- Account-purge Lambda for COPPA/GDPR deletion.
- Privacy policy.
- App Store / Play Store review prep (kids-category compliance).
- Accessibility audit with real assistive technology.
- Beta with the families from Phase 0.

### Definition of Done
- Full account + data deletion works and is verifiable.
- Privacy policy published; store review requirements met.
- Accessibility audit completed with real assistive tech and findings addressed.
- Beta feedback collected from Phase 0 families.

---

## Why This Order Beats the v1 Plan

The v1 plan (§8.2) front-loads AWS setup in Phase 0 and pushes the child experience into Phase 1 with cloud sync all the way at Phase 3. That means spending weeks on infrastructure before knowing whether the product works for a child. If a Phase 0 caregiver session (this plan) reveals the interaction model needs rework, none of that backend effort is wasted — because none of it exists yet.

The key insight for a solo dev: **each phase ships something usable.** Phase 1 is a real app one family can use offline forever. Phase 2 adds backup. Phase 3 adds multi-device. You can stop at any boundary.

---

## Cross-Phase Coupling & Cautions

1. **Design the Phase 1 local model close to the GraphQL `@model` shapes.** Don't let DataStore's schema opinions rigidly dictate Phase 1, but keep them in mind so Phase 2 isn't a rewrite. This is the one place the phases are tightly coupled.

2. **Verify the DataStore bet *before* Phase 2, not during it.** AWS has been moving toward Amplify Gen 2 and DataStore's roadmap has shifted. Spend half a day confirming DataStore is still the recommended offline-sync path for React Native before committing — swapping it out after Phase 3 would be painful.
