// ===== LocalStorage Helpers =====

const Storage = {
    get(key, fallback) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch { return fallback; }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch { /* ignore */ }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch { /* ignore */ }
    },

    getSettings() {
        return this.get('quizSettings', {
            darkMode: false,
            showExplanations: true,
            shuffleQuestions: false,
            shuffleChoices: false
        });
    },

    setSettings(settings) {
        this.set('quizSettings', settings);
    },

    getProgress(setId) {
        return this.get(`quizProgress_${setId}`, {
            currentQuestion: 0,
            selectedAnswers: [],
            isAnswered: false,
            isCorrect: null,
            isFinished: false,
            startTime: Date.now()
        });
    },

    setProgress(setId, progress) {
        this.set(`quizProgress_${setId}`, progress);
    },

    removeProgress(setId) {
        this.remove(`quizProgress_${setId}`);
    }
};

// Expose for global use
window.Storage = Storage;
