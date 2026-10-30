# ALEXIS AI — Android starter

## What is included
- Premium dark ALEXIS dashboard, chat, settings drawer and three-line menu
- Gemini text chat using `gemini-2.5-flash`
- Saved API key/model/voice preference using Capacitor Preferences
- Speech input/output using Android/browser speech services (device voices vary)
- GitHub Actions debug APK workflow

## Important implementation status
This is a starter scaffold, not a finished always-on assistant.
- The model selector stores a preferred Live model ID, but Gemini Live streaming is NOT wired yet.
- The speech buttons use Android/browser speech services; they are not Gemini Live audio.
- Native AccessibilityService, app launching, screen-reading and foreground microphone service are NOT included yet.
- Android/Play policy and OS restrictions prevent hidden, unrestricted background control.
- For production, do not ship a permanent Gemini API key in a client APK. Use a backend to mint ephemeral Live API tokens or proxy requests.

## Termux build
Install Termux from F-Droid. Then:

```bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git openjdk-17
node -v
npm -v
```

Extract the project ZIP into your Termux home, then:

```bash
cd ~/alexis-ai
npm install
npm run build
npx cap add android
npx cap sync android
```

The Android SDK/Gradle build is most reliable through GitHub Actions from a phone. Push this folder to a new GitHub repository:

```bash
git init
git add .
git commit -m "Initial ALEXIS AI Android starter"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/alexis-ai.git
git push -u origin main
```

Open GitHub repository → Actions → Build ALEXIS AI APK → latest run → Artifacts → `alexis-ai-apk` → download ZIP → extract `app-debug.apk` → install.

## API key
Create a key at https://aistudio.google.com/app/apikey and enter it in ALEXIS Settings. Treat it like a password. A key stored in an APK can be extracted; use a backend before sharing the app.

## Next native development steps
1. Integrate Gemini Live API using current documented model IDs and ephemeral-token security.
2. Add Kotlin AccessibilityService with explicit opt-in and visible disclosure; only implement allowlisted actions.
3. Add Android foreground service with persistent notification for user-started voice sessions.
4. Add permission request screens and test on the target Android device.
