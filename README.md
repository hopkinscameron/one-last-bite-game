# One Last Bite — Web Build

Playable WebGL build of **One Last Bite**, an endless room-based snake game for phones. GitHub Pages serves it at:

**https://hopkinscameron.github.io/one-last-bite-game/**

This repo holds **build output only** (`index.html`, `Build/`, `TemplateData/`, `manifest.webmanifest`, icons). The Unity source and design docs live in the `one-last-bite` repo. Never edit files here by hand: change the source, rebuild and redeploy.

## Play on iPhone

1. Open the URL above in Safari.
2. Tap Share › **Add to Home Screen**.
3. Launch from the icon. The game runs full-screen with no browser UI.

The build version (e.g. `v0.1.0 b2`) appears faintly in the bottom-right corner. Use it to confirm the phone is running the latest deploy.

## GitHub Pages setup (one time)

- **Settings › Pages:** Source **Deploy from a branch**, branch **`main`**, folder **`/ (root)`**.
- `.nojekyll` must stay in the root so Pages serves the files without Jekyll processing.
- The Unity build is uncompressed on purpose: Pages can't send the `Content-Encoding` headers that Brotli/Gzip Unity builds need.

## Branches

- `main` is what GitHub Pages serves.
- Each build arrives on a release branch, merged to `main` by pull request.
- Release branches are named `release/v<version>-<stage>-b<build>-<features>`, e.g. `release/v0.1.0-alpha-b2-core-snake`.
  - The version and build number come from the in-game corner label.
  - The stage is currently `alpha`.
  - The features part says what's new in that build.

## Deploying a new build

The two repos sit side by side:

```
Repositories/Games/
  One Last Bite/          # Unity project (one-last-bite)
  one-last-bite-game/     # this repo
```

1. **Build.** In the Unity project, choose **One Last Bite › Build WebGL**.
   - It checks the WebGL settings, bumps the build number, and builds to `Builds/WebGL/`.
   - The Console logs `[WebGLBuilder] Built v0.1.0 bN …`.
2. **(Optional) Test locally.** From the Unity project root:
   ```sh
   python3 -m http.server 8000 --directory Builds/WebGL
   ```
   - Open `http://localhost:8000`.
   - On a phone on the same Wi-Fi, open `http://<Mac's LAN IP>:8000`.
   - Opening `index.html` straight from disk does not work.
3. **Create the release branch** in this repo, from an up-to-date `main`:
   ```sh
   git checkout main && git pull
   git checkout -b release/v0.1.0-alpha-bN-<features>
   ```
4. **Copy the build into this repo.** From the Unity project root:
   ```sh
   rsync -a --delete \
     --exclude '.git' --exclude '.gitignore' --exclude '.nojekyll' \
     --exclude 'README.md' --exclude 'CNAME' \
     Builds/WebGL/ ../one-last-bite-game/
   ```
   - `--delete` removes the previous build's hashed files.
   - The excludes keep this repo's own files.
5. **Commit, push and merge.** From this repo:
   ```sh
   git add -A
   git commit -m "Build v0.1.0 bN (alpha): <features>"
   git push -u origin HEAD
   ```
   Open a pull request into `main` and merge it.
6. **Check it.**
   - Wait for the Pages deployment (the **Actions** tab, about 1 minute). Then open the URL and confirm the corner label shows the new build number.
   - Pages caches `index.html` for up to 10 minutes. If the old number shows, reload after a few minutes.
   - In the home-screen app, swipe it closed and relaunch.
7. **Commit the stamped `Assets/Data/Config/BuildInfo.asset`** in the Unity project, so the source repo records which build went out.
