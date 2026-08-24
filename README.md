In The Name of Allah


# 🏥 Medical Ethics Quiz | آزمون اخلاق پزشکی

Interactive exam platform with 130+ questions, RTL support, dark mode, and manifest-based content management. Add new question sets by updating `manifest.json`.

---

## ✨ Features

- 📚 **130+ questions** from medical ethics board exams
- 🔄 **Manifest-based content** — add new question sets by uploading JSON files
- 🌙 **Dark/Light mode** with persistent settings
- 📱 **Fully responsive** — works on desktop, tablet, and mobile
- 🔤 **RTL support** — auto-detects Persian content with correct lettering (الف، ب، ج)
- 💾 **Auto-save progress** — resume where you left off
- ⌨️ **Keyboard shortcuts** — 1-4 for answers, Enter to check, Arrow keys to navigate
- 📊 **Progress tracking** — question navigator with status indicators (✓, ✕, •)
- 📝 **Review mode** — see all answers with explanations
- 🧩 **Zero dependencies** — pure HTML, CSS, vanilla JS

---

## 🚀 Live Demo

[https://yourusername.github.io/quiz-app/](https://yourusername.github.io/quiz-app/)

---

## 📁 Project Structure

```
quiz-app/
├── index.html          # Main entry point
├── manifest.json       # 🔑 List of all question sets
├── css/
│   └── style.css       # All styling (dark mode, responsive, RTL)
├── js/
│   ├── app.js          # Core quiz engine
│   ├── renderer.js     # UI rendering functions
│   └── storage.js      # LocalStorage handling
└── data/
    └── questions-1402.json   # Question bank
```

---

## 📝 How to Add New Questions

### Step 1: Create your JSON file

Create `data/questions-1404.json` with this format:

```json
[
  {
    "id": 1,
    "category": "Category Name",
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Optional explanation"
  }
]
```

### Step 2: Update manifest.json

```json
{
  "sets": [
    {
      "id": "1402",
      "label": "اخلاق پزشکی ۱۴۰۲-۱۴۰۳",
      "file": "data/questions-1402.json",
      "total": 130,
      "icon": "📖"
    },
    {
      "id": "1404",
      "label": "اخلاق پزشکی ۱۴۰۴",
      "file": "data/questions-1404.json",
      "total": 150,
      "icon": "✨"
    }
  ]
}
```

### Step 3: Push to GitHub

The new button appears automatically! 🎉

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/quiz-app.git
cd quiz-app

# Start a local server
python -m http.server 8000
# or
npx serve
# or open index.html directly (CORS might block JSON loading)
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Select option A (الف) |
| `2` | Select option B (ب) |
| `3` | Select option C (ج) |
| `4` | Select option D (د) |
| `Enter` | Check answer / Continue |
| `←` | Previous question |
| `→` | Next question |

---

## 🎯 Question Format

```json
{
  "id": 1,
  "category": "روش تحقیق در علوم پزشکی",
  "question": "در کدامیک از دسته‌بندی‌های زیر، مجلات علمی با بالاترین سطح کیفی از نظر نسبت استناد قرار می‌گیرند؟",
  "options": ["Q1", "Q2", "Q3", "Q4"],
  "correct": 0,
  "explanation": "در رتبه‌بندی مجلات علمی بر اساس نسبت استنادها، مجلات به ۴ چارک تقسیم می‌شوند که چارک اول نشان‌دهنده ۲۵ درصد برتر مجلات است."
}
```

---

## 🔧 Settings

- **Shuffle questions** — randomize question order
- **Shuffle choices** — randomize answer order
- **Dark mode** — toggle light/dark theme
- **Show explanations** — show/hide answer explanations

---

## 🌐 RTL Support

The app auto-detects Persian content and adjusts:

- Direction (RTL/LTR)
- Option letters (الف، ب، ج instead of A, B, C)
- Text alignment
- Layout components

---

## 📄 License

MIT — Use freely for personal and educational purposes.

---

## 🙏 Credits

Built with ❤️ for medical ethics students. Based on official exam materials.

---

## 📧 Contact

Questions or feedback? Open an issue or reach out.

---

**الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ**

---

Would you like me to adjust anything or add more sections? 🚀
