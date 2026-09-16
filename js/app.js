const App = {
    manifest: null,
    questions: [],
    selectedSetId: null,
    currentQuestion: 0,
    selectedAnswers: [],
    checkedAnswers: [],
    isFinished: false,
    startTime: Date.now(),
    view: 'home',
    reviewQuestion: null,
    settings: null,
    timerId: null,
    navigatorOpen: false,
    el: document.getElementById('app'),

    async init() {
        this.settings = Storage.getSettings();
        this.applyTheme();
        await this.loadManifest();
        this.bindEvents();
        this.render();
    },

    async loadManifest() {
        try {
            const response = await fetch('manifest.json');
            if (!response.ok) throw new Error('manifest.json not found');
            this.manifest = await response.json();
            if (!Array.isArray(this.manifest.sets) || !this.manifest.sets.length) {
                throw new Error('No question sets found in manifest');
            }
            await this.loadSet(this.manifest.sets[0].id, false);
        } catch (error) {
            console.error('Error loading manifest:', error);
            this.el.innerHTML = Renderer.error('Unable to load the question library.');
        }
    },

    shuffle(items, seed) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            const j = seed % (i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    prepareQuestions(rawQuestions, setId) {
        let questions = rawQuestions.map(question => ({
            ...question,
            options: [...question.options]
        }));
        let seed = Array.from(setId).reduce((total, char) => total + char.charCodeAt(0), 17);
        if (this.settings.shuffleQuestions) questions = this.shuffle(questions, seed);
        if (this.settings.shuffleChoices) {
            questions = questions.map(question => {
                const correctText = question.options[question.correct];
                const options = this.shuffle(question.options, seed += 31);
                return { ...question, options, correct: options.indexOf(correctText) };
            });
        }
        return questions;
    },

    async loadSet(setId, openQuiz = true) {
        const set = this.manifest?.sets.find(item => item.id === setId);
        if (!set) return;
        try {
            const response = await fetch(set.file);
            if (!response.ok) throw new Error(`Failed to load ${set.file}`);
            const rawQuestions = await response.json();
            if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
                this.el.innerHTML = Renderer.error('This question set is empty and cannot be started.');
                return;
            }
            this.questions = this.prepareQuestions(rawQuestions, setId);
            this.selectedSetId = setId;
            this.loadProgress();
            if (openQuiz) {
                this.view = 'quiz';
                this.saveProgress();
            }
            this.render();
        } catch (error) {
            console.error('Error loading questions:', error);
            this.el.innerHTML = Renderer.error('Unable to load this question set.');
        }
    },

    loadProgress() {
        const progress = Storage.getProgress(this.selectedSetId, this.questions.length);
        this.currentQuestion = Math.min(progress.currentQuestion || 0, this.questions.length - 1);
        this.selectedAnswers = Array.isArray(progress.selectedAnswers) &&
            progress.selectedAnswers.length === this.questions.length
            ? progress.selectedAnswers : new Array(this.questions.length).fill(null);
        this.checkedAnswers = Array.isArray(progress.checkedAnswers) &&
            progress.checkedAnswers.length === this.questions.length
            ? progress.checkedAnswers : new Array(this.questions.length).fill(false);
        if (progress.checkedAnswers === undefined && progress.isAnswered) {
            this.checkedAnswers[this.currentQuestion] = true;
        }
        this.isFinished = Boolean(progress.isFinished);
        this.startTime = progress.startTime || Date.now();
        this.view = progress.view || 'home';
    },

    saveProgress() {
        if (!this.selectedSetId) return;
        Storage.setProgress(this.selectedSetId, {
            currentQuestion: this.currentQuestion,
            selectedAnswers: this.selectedAnswers,
            checkedAnswers: this.checkedAnswers,
            isFinished: this.isFinished,
            startTime: this.startTime,
            view: this.view
        });
    },

    goToView(view) {
        this.view = view;
        this.reviewQuestion = null;
        this.saveProgress();
        this.render();
    },

    goHome() {
        if (this.view === 'quiz' && !this.isFinished &&
            this.selectedAnswers.some(answer => answer !== null) &&
            !confirm('Leave this quiz? Your progress will be saved.')) return;
        this.goToView('home');
    },

    toggleNavigator() {
        this.navigatorOpen = !this.navigatorOpen;
        document.querySelector('.quiz-layout')?.classList.toggle('navigator-visible', this.navigatorOpen);
    },

    goToQuestion(index) {
        if (index < 0 || index >= this.questions.length) return;
        this.currentQuestion = index;
        this.saveProgress();
        this.render();
    },

    async startQuiz(setId) {
        if (setId !== this.selectedSetId) {
            await this.loadSet(setId, false);
        }
        this.selectedAnswers = new Array(this.questions.length).fill(null);
        this.checkedAnswers = new Array(this.questions.length).fill(false);
        this.currentQuestion = 0;
        this.isFinished = false;
        this.startTime = Date.now();
        this.view = 'quiz';
        this.saveProgress();
        this.render();
    },

    finishQuiz() {
        const unanswered = this.selectedAnswers.filter(answer => answer === null).length;
        if (unanswered && !confirm(`You have ${unanswered} unanswered questions. Finish anyway?`)) return;
        this.isFinished = true;
        this.view = 'results';
        this.saveProgress();
        this.render();
    },

    restartQuiz() {
        if (!confirm('Restart quiz? Your current progress will be lost.')) return;
        this.startQuiz(this.selectedSetId);
    },

    resetAllProgress() {
        if (this.selectedSetId) Storage.removeProgress(this.selectedSetId);
        this.selectedAnswers = new Array(this.questions.length).fill(null);
        this.checkedAnswers = new Array(this.questions.length).fill(false);
        this.currentQuestion = 0;
        this.isFinished = false;
        this.view = 'home';
        this.saveProgress();
        this.closeSettings();
        this.render();
    },

    toggleOption(index) {
        if (this.checkedAnswers[this.currentQuestion]) return;
        this.selectedAnswers[this.currentQuestion] =
            this.selectedAnswers[this.currentQuestion] === index ? null : index;
        this.saveProgress();
        this.render();
    },

    checkAnswer() {
        const question = this.questions[this.currentQuestion];
        const answer = this.selectedAnswers[this.currentQuestion];
        if (!question || answer === null) return;
        this.checkedAnswers[this.currentQuestion] = true;
        this.saveProgress();
        this.render();
    },

    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.saveProgress();
            this.render();
        } else {
            this.finishQuiz();
        }
    },

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.saveProgress();
            this.render();
        }
    },

    showReviewDetail(index) {
        this.reviewQuestion = index;
        this.view = 'review_detail';
        this.render();
    },

    openSettings() {
        this.closeSettings();
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'settings-modal';
        overlay.innerHTML = Renderer.settingsModal(this.settings);
        document.body.appendChild(overlay);
        overlay.querySelectorAll('.toggle-track').forEach(toggle => {
            const handler = () => this.toggleSetting(toggle.dataset.key);
            toggle.addEventListener('click', handler);
            toggle.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handler();
                }
            });
        });
        overlay.addEventListener('click', event => {
            if (event.target === overlay) this.closeSettings();
        });
    },

    closeSettings() {
        document.getElementById('settings-modal')?.remove();
    },

    async toggleSetting(key) {
        this.settings[key] = !this.settings[key];
        Storage.setSettings(this.settings);
        this.applyTheme();
        if (key === 'shuffleQuestions' || key === 'shuffleChoices') {
            if (this.selectedSetId) Storage.removeProgress(this.selectedSetId);
            await this.loadSet(this.selectedSetId, false);
            this.view = 'home';
            this.render();
        } else {
            this.openSettings();
        }
    },

    applyTheme() {
        document.documentElement.removeAttribute('data-theme');
        if (this.settings.darkMode) document.documentElement.setAttribute('data-theme', 'dark');
    },

    setDirection(text) {
        const isPersian = /[\u0600-\u06FF]/.test(text || '');
        document.documentElement.dir = isPersian ? 'rtl' : 'ltr';
        document.documentElement.lang = isPersian ? 'fa' : 'en';
    },

    getResults() {
        let correct = 0, incorrect = 0, unanswered = 0;
        this.selectedAnswers.forEach((answer, index) => {
            if (answer === null) unanswered++;
            else if (answer === this.questions[index].correct) correct++;
            else incorrect++;
        });
        return {
            total: this.questions.length,
            correct,
            incorrect,
            unanswered,
            percentage: this.questions.length ? Math.round(correct / this.questions.length * 100) : 0,
            timeTaken: Math.floor((Date.now() - this.startTime) / 1000)
        };
    },

    render() {
        if (!this.el) return;
        if (this.view === 'home') {
            this.setDirection(this.manifest?.sets?.[0]?.label);
            this.el.innerHTML = Renderer.home(this.manifest);
            this.el.querySelectorAll('.set-card').forEach(card =>
                card.addEventListener('click', () => this.startQuiz(card.dataset.setId)));
        } else if (this.view === 'quiz') {
            this.setDirection(this.questions[this.currentQuestion]?.question);
            this.el.innerHTML = Renderer.quiz(this, this.questions);
            this.startTimer();
        } else if (this.view === 'results') {
            this.setDirection(this.questions[0]?.question);
            this.stopTimer();
            this.el.innerHTML = Renderer.results(this.getResults());
        } else if (this.view === 'review') {
            this.setDirection(this.questions[0]?.question);
            this.el.innerHTML = Renderer.review(this.questions, this.selectedAnswers);
        } else if (this.view === 'review_detail') {
            const question = this.questions[this.reviewQuestion];
            this.setDirection(question?.question);
            this.el.innerHTML = Renderer.reviewDetail(
                question, this.reviewQuestion, this.selectedAnswers[this.reviewQuestion]);
        }
    },

    startTimer() {
        this.stopTimer();
        this.timerId = setInterval(() => {
            const timer = document.querySelector('[data-timer]');
            if (timer) timer.textContent = Renderer.formatTime((Date.now() - this.startTime) / 1000);
        }, 1000);
    },

    stopTimer() {
        if (this.timerId) clearInterval(this.timerId);
        this.timerId = null;
    },

    handleKeydown(event) {
        if (this.view !== 'quiz' || ['INPUT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName)) return;
        if (/^[1-9]$/.test(event.key) && Number(event.key) <= this.questions[this.currentQuestion].options.length) {
            this.toggleOption(Number(event.key) - 1);
        } else if (event.key === 'Enter') {
            if (this.checkedAnswers[this.currentQuestion]) this.nextQuestion();
            else this.checkAnswer();
        } else if (event.key === 'ArrowLeft') {
            this.previousQuestion();
        } else if (event.key === 'ArrowRight' && this.checkedAnswers[this.currentQuestion]) {
            this.nextQuestion();
        }
    },

    bindEvents() {
        document.addEventListener('keydown', event => this.handleKeydown(event));
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
