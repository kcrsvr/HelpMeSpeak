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

> If you want the app in the Kids sub-category, set it in the App Store tab under
> "This app is made for kids" and choose the age band (see Age Rating below).

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

"Made for Kids" (optional): if you opt in, choose the **Ages 5 and under** or
**6–8** band as appropriate. Note: Kids-category apps must have no external links
out of the app without a parental gate — your PIN gate covers the caregiver area.

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
no login or account. To reach Caregiver mode, tap the lock icon and enter the PIN
set during onboarding; for review, the PIN is: [ADD THE PIN YOU SET].

The app requests microphone, camera, and photo access only so a caregiver can
optionally record a word or add a picture. All permissions are optional and the
app functions if they are denied. No data leaves the device.
```

> ⚠️ Replace [ADD THE PIN YOU SET] with the actual caregiver PIN so the reviewer
> can get into caregiver mode. Kids-category apps are tested thoroughly here.
```
