# KIERAN.EXE Portfolio

Retro-futuristic single-page portfolio with an interactive canvas mini-game (`Deployment Defender`).

## Features
- Cyberpunk-inspired UI with glitch/typewriter/particle effects
- Experience, projects, and expanded skills matrix
- Playable mini-game with score, levels, boss waves, and local high-score persistence
- GitHub Pages deployment workflow via GitHub Actions

## Project Structure

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   └── game.js
├── assets/
│   ├── resume.pdf
│   └── screenshots/
└── .github/workflows/
    └── deploy.yml
```

## Run Locally

### Option 1: Makefile (recommended)

```bash
make run
```

Default URL: `http://localhost:8080`

Use a custom port:

```bash
make run PORT=3000
```

### Option 2: Direct Python server

```bash
python3 -m http.server 8080
```

## Controls (Mini-Game)
- Move: `A` / `D` or `←` / `→`
- Shoot: `Space`
- Mobile: on-screen controls
