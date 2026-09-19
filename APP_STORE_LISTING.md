# HelpMeSpeak — App Store Connect Listing Content

Copy-paste ready content for the App Store Connect submission. Fields are grouped
by where they appear in App Store Connect.

---

## App Information

**Name (30 char max):**
```
HelpMeSpeak
```

**Subtitle (30 char max):**
```
Words, pictures & speech
```

**Primary Category:** Education
**Secondary Category:** (optional) Health & Fitness — or leave blank

> DECISION: Do NOT opt into the Kids Category for this submission. Leave the
> "This app is made for kids" setting OFF in the App Store tab. The app targets
> Education / 4+ (see Age Rating below). Rationale: the app collects no data, has
> no accounts, ads, tracking, or external links, so the standard Education/4+
> rating is the lower-risk path to approval. You can opt into "Made for Kids"
> in a later version if desired.

---

## Promotional Text (170 char max — editable anytime without review)
```
Help a child connect a picture, a sound, and a word — then celebrate every win. Simple, calm, and fully private. Built for non-verbal and emerging communicators.
```

---

## Description

```
HelpMeSpeak is a gentle, picture-based communication and learning aid for
non-verbal, minimally verbal, and emerging communicators — including autistic
children. It turns everyday words into a simple, repeatable experience: see a
familiar picture, hear the word spoken, watch it spelled out letter by letter,
then celebrate.

Designed with caregivers, for children.

CHILD MODE
- Tap a word to see its picture, hear it spoken, and watch each letter light up.
- A friendly "press the letters" practice lets the child spell the word
  themselves, at their own pace, with an encouraging reward at the end.
- Big, clear pictures and letters that adapt to the device and the word.
- Four calm, high-contrast themes.
- Recently used words are always one tap away.

CAREGIVER MODE (PIN protected)
- Add your own words with familiar photos and your own voice recordings.
- Organize words into categories that fit your child.
- Create profiles for more than one child.
- Everything is set up the way you know works best.

PRIVATE BY DESIGN
- All content stays on your device. No accounts, no sign-in, no servers.
- No ads. No third-party tracking or analytics.
- Works fully offline.

HelpMeSpeak is meant to be set up and managed by a parent, caregiver, teacher,
or therapist, and used together with the child.

Note: HelpMeSpeak is a communication and learning aid, not a medical device, and
does not provide medical or therapeutic advice.
```

---

## Keywords (100 char max, comma-separated, no spaces after commas)
```
AAC,nonverbal,autism,speech,communication,special needs,learning,words,picture,toddler,SLP,visual
```

---

## Support URL (required)
Use the privacy policy page (or a simple contact page) until you have a site:
```
https://kcrsvr.github.io/HelpMeSpeak/privacy-policy.html
```

## Marketing URL (optional)
```
(leave blank for now)
```

---

## Privacy Policy URL (required)
After enabling GitHub Pages on the repo (Settings → Pages → deploy from `main`,
folder `/docs`):
```
https://kcrsvr.github.io/HelpMeSpeak/privacy-policy.html
```

---

## App Privacy (the "nutrition label" — Data Collection questionnaire)

Answer: **"No, we do not collect data from this app."**

Rationale: HelpMeSpeak stores everything on-device, has no accounts, no network
calls, no analytics, and no ads. This is the "Data Not Collected" state.

---

## Age Rating questionnaire answers
Answer **None / No** to every content category:
- Cartoon or Fantasy Violence: None
- Realistic Violence: None
- Sexual Content or Nudity: None
- Profanity or Crude Humor: None
- Alcohol, Tobacco, or Drug Use: None
- Mature/Suggestive Themes, Horror, Gambling, Contests: None
- Unrestricted Web Access: No
- Medical/Treatment Information: No

Expected result: **Ages 4+**.

"Made for Kids": **DO NOT opt in for this submission.** Leave the "This app is
made for kids" toggle OFF. Target the standard **Education / 4+** rating. (The app
has no external links, ads, tracking, or data collection, so it clears the Kids
rules anyway — but staying out of the Kids Category keeps the review bar lighter
for a first approval. Revisit in a future version if you want the Kids badge.)

---

## Export Compliance
Already handled in app.json: `ITSAppUsesNonExemptEncryption: false`.
In App Store Connect this pre-answers the encryption question — no uploads of
compliance documentation needed.

---

## Screenshots needed
Required sizes (capture from a device or simulator):
- **6.7" iPhone** (e.g. iPhone 15/16 Pro Max) — REQUIRED, at least 1 (up to 10)
- **13" iPad** — REQUIRED because the app supports tablets (supportsTablet: true)

Suggested screens to capture:
1. Child home with categories + Recently Used
2. A word experience showing the big picture
3. The letter-by-letter spelling in progress
4. The "press the letters" practice with the confetti reward
5. Caregiver mode: adding a word with a photo

Tip: `npx expo start`, run on the simulator, and use Cmd+S in the simulator to
save screenshots at the correct resolution.

---

## Review Notes (App Review Information → Notes)
```
HelpMeSpeak is a local-only communication aid for non-verbal children. There is
no login and no account.

On first launch the app runs a short onboarding where YOU (the reviewer) set a
4-digit Caregiver PIN of your choosing. That same PIN unlocks Caregiver Mode:
from the child home screen, tap the lock icon and enter the PIN you set during
onboarding. There is no preset password to supply.

Caregiver Mode is where a caregiver can add words with photos and voice
recordings, organize categories, and manage profiles. The app requests
microphone, camera, and photo access only for these optional actions. All
permissions are optional and the app functions fully if they are denied. No data
ever leaves the device.
```

> Note: No PIN needs to be provided in these notes. On a clean install the app
> always starts at onboarding, where the reviewer sets their own PIN — there is no
> seeded data or preset PIN (verified in code: onboardingComplete/pinHash default
> to false/null and are only set once onboarding is completed). The notes above
> simply explain that the onboarding PIN is the same one that unlocks Caregiver
> Mode, so the reviewer isn't left hunting for a password.
```
