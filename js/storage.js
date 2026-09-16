const Storage = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (error) {
            console.warn(`Unable to read saved quiz data for "${key}".`, error);
            return fallback;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Unable to save quiz data for "${key}".`, error);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Unable to remove saved quiz data for "${key}".`, error);
        }
    },

    getSettings() {
        return {
            darkMode: false,
            showExplanations: true,
            shuffleQuestions: false,
            shuffleChoices: false,
            ...this.get('quizSettings', {})
        };
    },

    setSettings(settings) { return this.set('quizSettings', settings); },

    getProgress(setId) {
        return this.get(`quizProgress_${setId}`, {
            currentQuestion: 0,
            selectedAnswers: [],
            checkedAnswers: [],
            isFinished: false,
            startTime: Date.now(),
            view: 'home'
        });
    },

    setProgress(setId, progress) { return this.set(`quizProgress_${setId}`, progress); },
    removeProgress(setId) { this.remove(`quizProgress_${setId}`); }
};

window.Storage = Storage;
