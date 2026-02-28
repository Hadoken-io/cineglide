# 🎬 CineSwipe

> Tinder for movies. Swipe your way to your next favourite film.

CineSwipe is a sleek, minimalist movie discovery web app. Swipe right to save, left to skip, or up to Google search — just like Tinder but for films and TV shows. Built with a beautiful frosted glass aesthetic inspired by iOS.

![CineSwipe Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Made With](https://img.shields.io/badge/Made%20With-HTML%20CSS%20JS-orange)

---

## ✨ Features

- 🃏 **Tinder-style swipe cards** — drag or use buttons to swipe
- 🔄 **Flip card animation** — tap to reveal synopsis, ratings & streaming info
- 🤖 **Smart recommendations** — ML-powered suggestions based on what you save
- 🎭 **Genre picker** — personalise your feed on first launch
- 🍿 **Cook mode** — one-time genre session that doesn't affect your home feed
- ❤️ **Saved list** — all your saved movies in a beautiful grid
- 📺 **Movies & TV Shows** — toggle between both
- 🔞 **Age filter** — All Ages or 18+ content toggle
- 🌊 **Streaming info** — see where to watch instantly
- 🔍 **Google search** — swipe up or tap 🔍 to search any title
- 📱 **Mobile + Desktop** — works beautifully on all screen sizes
- 🍃 **Foggy glass aesthetic** — warm, minimal, iOS-inspired design

---

## 🚀 Live Demo

👉 **[cineswipe.vercel.app](https://cineswipe.vercel.app)**

---

## 🛠️ Built With

| Technology | Purpose |
|---|---|
| HTML5 | Structure |
| CSS3 | Styling, glassmorphism, animations |
| Vanilla JavaScript | All logic, swipe detection, API calls |
| TMDB API | Movie & TV data, posters, streaming info |
| Vercel | Free hosting & deployment |
| Google Fonts | Cormorant Garamond + Outfit typography |

---

## 📦 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/cineswipe.git
cd cineswipe
```

### 2. Get a free TMDB API key
- Go to [themoviedb.org](https://www.themoviedb.org)
- Sign up free → Settings → API → Request API Key
- Copy your **API Key (v3 auth)**

### 3. Add your API key
Open `app.js` and replace line 4:
```javascript
const API_KEY = 'YOUR_TMDB_KEY_HERE';
```

### 4. Run locally
Open `index.html` with [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code — or just double-click the file.

---

## 🎮 How to Use

| Action | What Happens |
|---|---|
| **Swipe Right** / ❤️ button | Save the movie |
| **Swipe Left** / ✕ button | Skip the movie |
| **Swipe Up** / 🔍 button | Google search the movie |
| **Tap the card** | Flip to see synopsis, rating & streaming |
| **Tap a saved movie** | Expand + see ML recommendations |
| **Cook tab** | Pick genres for a one-time browsing session |
| **Saved tab** | View all your saved movies |

---

## 🤖 How Recommendations Work

When you open a saved movie, CineSwipe uses **TMDB's recommendation engine** to find 10 similar titles — the same engine that powers "people who liked this also liked…". For example:

- Save **Zootopia** → get Toy Story, Moana, Inside Out
- Save **Shutter Island** → get Gone Girl, Prisoners, Black Swan

If no recommendations are found, it automatically falls back to TMDB's "similar movies" database.

---

## 🌐 Deploy Your Own

1. Fork this repo
2. Add your TMDB API key to `app.js`
3. Go to [vercel.com](https://vercel.com) → Import your fork → Deploy
4. Done! Your own CineSwipe is live in 60 seconds 🚀

---

## 📁 Project Structure

```
cineswipe/
├── index.html      # All pages (Home, Cook, Saved) + modals
├── style.css       # Full glassmorphism styling + animations
├── app.js          # All logic — API, swipe, ML, navigation
└── README.md       # You are here
```

---

## 🗺️ Roadmap

- [ ] User accounts & cloud sync
- [ ] Share saved lists with friends
- [ ] Watchlist export to Letterboxd
- [ ] Dark mode
- [ ] PWA support (install as app)
- [ ] Trailer preview on card flip

---

## 🙏 Credits

- Movie data by [TMDB](https://www.themoviedb.org) — *This product uses the TMDB API but is not endorsed or certified by TMDB.*
- Fonts by [Google Fonts](https://fonts.google.com)
- Hosted on [Vercel](https://vercel.com)

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

You are free to use, copy, modify, and distribute this project. Just keep the credit. 🙌

---

<p align="center">Made with ❤️ and lots of 🍿</p>
