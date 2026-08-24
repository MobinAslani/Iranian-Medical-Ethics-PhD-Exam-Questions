// ===== Main Application =====

const App = {
    // State
    manifest: null,
    questions: [],
    selectedSetId: null,
    currentQuestion: 0,
    selectedAnswers: [],
    isAnswered: false,
    isCorrect: null,
    isFinished: false,
    startTime: Date.now(),
    view: 'home',
    reviewQuestion: null,
    settings: null,

    // DOM
    el: document.getElementById('app'),

    // ===== Init =====
    async init() {
        this.settings = Storage.getSettings();
        this.applyTheme();
        await this.loadManifest();
        this.render();
        this.bindEvents();
    },

    // ===== Load Data =====
    async loadManifest() {
        try {
            const res = await fetch('manifest.json');
            if (!res.ok) throw new Error('manifest.json not found');
            this.manifest = await res.json();
            if (!this.manifest.sets || this.manifest.sets.length === 0) {
                throw new Error('No question sets found in manifest');
            }
            await this.loadSet(this.manifest.sets[0].id);
        } catch (err) {
            console.error('Error loading manifest:', err);
            this.el.innerHTML = Renderer.error('Failed to load manifest.json. Please check the file exists.');
        }
    },

    async loadSet(setId) {
        const set = this.manifest.sets.find(s => s.id === setId);
        if (!set) {
            console.error('Set not found:', setId);
            return;
        }

        try {
            const res = await fetch(set.file);
            if (!res.ok) throw new Error(`Failed to load ${set.file}`);
            this.questions = await res.json();
            this.selectedSetId = setId;
            this.loadProgress();
            this.render();
        } catch (err) {
            console.error('Error loading questions:', err);
            this.el.innerHTML = Renderer.error(`Failed to load ${set.file}. Please check the file exists.`);
        }
    },

    // ===== Progress =====
    loadProgress() {
        if (!this.selectedSetId) return;
        const progress = Storage.getProgress(this.selectedSetId);
        this.currentQuestion = progress.currentQuestion || 0;
        this.selectedAnswers = progress.selectedAnswers || new Array(this.questions.length).fill(null);
        this.isAnswered = progress.isAnswered || false;
        this.isCorrect = progress.isCorrect || null;
        this.isFinished = progress.isFinished || false;
        this.startTime = progress.startTime || Date.now();
        this.view = progress.view || 'home';

        if (this.selectedAnswers.length !== this.questions.length) {
            this.selectedAnswers = new Array(this.questions.length).fill(null);
        }
    },

    saveProgress() {
        if (!this.selectedSetId) return;
        Storage.setProgress(this.selectedSetId, {
            currentQuestion: this.currentQuestion,
            selectedAnswers: this.selectedAnswers,
            isAnswered: this.isAnswered,
            isCorrect: this.isCorrect,
            isFinished: this.isFinished,
            startTime: this.startTime,
            view: this.view
        });
    },

    // ===== Navigation =====
    goToView(view) {
        this.view = view;
        this.reviewQuestion = null;
        this.saveProgress();
        this.render();
    },

    goToQuestion(index) {
        if (index < 0 || index >= this.questions.length) return;
        this.currentQuestion = index;
        this.isAnswered = false;
        this.isCorrect = null;
        this.saveProgress();
        this.render();
    },

    startQuiz(setId) {
        if (setId && setId !== this.selectedSetId) {
            this.loadSet(setId);
            return;
        }
        this.selectedAnswers = new Array(this.questions.length).fill(null);
        this.currentQuestion = 0;
        this.isAnswered = false;
        this.isCorrect = null;
        this.isFinished = false;
        this.startTime = Date.now();
        this.view = 'quiz';
        this.saveProgress();
        this.render();
    },

    finishQuiz() {
        const unanswered = this.selectedAnswers.filter(a => a === null).length;
        if (unanswered > 0) {
            if (!confirm(`You have ${unanswered} unanswered questions. Are you sure you want to finish?`)) {
                return;
            }
        }
        this.isFinished = true;
        this.view = 'results';
        this.saveProgress();
        this.render();
    },

    restartQuiz() {
        if (!confirm('Restart quiz? Your current progress will be lost.')) return;
        this.selectedAnswers = new Array(this.questions.length).fill(null);
        this.currentQuestion = 0;
        this.isAnswered = false;
        this.isCorrect = null;
        this.isFinished = false;
        this.startTime = Date.now();
        this.view = 'quiz';
        this.saveProgress();
        this.render();
    },

    resetAllProgress() {
        if (this.selectedSetId) {
            Storage.removeProgress(this.selectedSetId);
        }
        this.selectedAnswers = new Array(this.questions.length).fill(null);
        this.currentQuestion = 0;
        this.isAnswered = false;
        this.isCorrect = null;
        this.isFinished = false;
        this.startTime = Date.now();
        this.view = 'home';
        this.saveProgress();
        this.render();
        this.closeSettings();
    },

    // ===== Quiz Actions =====
    selectAnswer(index) {
        if (this.isAnswered) return;
        this.selectedAnswers[this.currentQuestion] = index;
        this.saveProgress();
        this.render();
    },

    checkAnswer() {
        const q = this.questions[this.currentQuestion];
        if (!q || this.selectedAnswers[this.currentQuestion] === null) return;
        const answer = this.selectedAnswers[this.currentQuestion];
        this.isAnswered = true;
        this.isCorrect = answer === q.correct;
        this.saveProgress();
        this.render();
    },

    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.isAnswered = false;
            this.isCorrect = null;
            this.saveProgress();
            this.render();
        } else {
            this.finishQuiz();
        }
    },

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.isAnswered = false;
            this.isCorrect = null;
            this.saveProgress();
            this.render();
        }
    },

    showReviewDetail(index) {
        this.reviewQuestion = index;
        this.view = 'review_detail';
        this.render();
    },

    // ===== Settings =====
    openSettings() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'settings-modal';
        overlay.innerHTML = Renderer.settingsModal(
            this.settings,
            null,
            () => this.resetAllProgress()
        );
        document.body.appendChild(overlay);

        overlay.querySelectorAll('.toggle-track').forEach(el => {
            el.addEventListener('click', () => {
                const key = el.dataset.key;
                this.toggleSetting(key);
                const newEl = document.querySelector(`.toggle-track[data-key="${key}"]`);
                if (newEl) {
                    if (this.settings[key]) {
                        newEl.classList.add('active');
                    } else {
                        newEl.classList.remove('active');
                    }
                }
            });
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeSettings();
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeSettings();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    },

    closeSettings() {
        document.getElementById('settings-modal')?.remove();
    },

    toggleSetting(key) {
        this.settings[key] = !this.settings[key];
        Storage.setSettings(this.settings);

        if (key === 'shuffleQuestions' || key === 'shuffleChoices') {
            this.loadSet(this.selectedSetId);
        }

        this.applyTheme();
    },

    applyTheme() {
        if (this.settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    },

    // ===== Results =====
    getResults() {
        const total = this.questions.length;
        let correct = 0,
            incorrect = 0,
            unanswered = 0;
        this.selectedAnswers.forEach((answer, idx) => {
            if (answer === null) unanswered++;
            else if (answer === this.questions[idx].correct) correct++;
            else incorrect++;
        });
        const answered = total - unanswered;
        return {
            total,
            correct,
            incorrect,
            unanswered,
            percentage: answered > 0 ? Math.round((correct / answered) * 100) : 0,
            timeTaken: Math.floor((Date.now() - this.startTime) / 1000)
        };
    },

    // ===== Rendering =====
    render() {
        if (!this.el) return;

        if (this.view === 'home') {
            if (!this.manifest) return;
            this.el.innerHTML = Renderer.home(this.manifest, (setId) => this.startQuiz(setId), () => this.openSettings());
            this.el.querySelectorAll('.set-card').forEach(card => {
                card.addEventListener('click', () => {
                    const setId = card.dataset.setId;
                    this.startQuiz(setId);
                });
            });
        } else if (this.view === 'quiz') {
            if (!this.questions || this.questions.length === 0) {
                this.el.innerHTML = Renderer.error('No questions loaded.');
                return;
            }
            const state = {
                currentQuestion: this.currentQuestion,
                selectedAnswers: this.selectedAnswers,
                isAnswered: this.isAnswered,
                isCorrect: this.isCorrect,
                startTime: this.startTime
            };
            this.el.innerHTML = Renderer.quiz(
                state,
                this.questions,
                (idx) => this.selectAnswer(idx),
                () => this.checkAnswer(),
                () => this.nextQuestion(),
                () => this.previousQuestion(),
                () => this.finishQuiz(),
                (idx) => this.goToQuestion(idx)
            );
        } else if (this.view === 'results') {
            const results = this.getResults();
            this.el.innerHTML = Renderer.results(
                results,
                () => this.goToView('review'),
                () => this.restartQuiz(),
                () => {
                    this.goToView('home');
                    this.selectedAnswers = new Array(this.questions.length).fill(null);
                    this.currentQuestion = 0;
                    this.isAnswered = false;
                    this.isCorrect = null;
                    this.isFinished = false;
                    this.saveProgress();
                }
            );
        } else if (this.view === 'review') {
            this.el.innerHTML = Renderer.review(
                this.questions,
                this.selectedAnswers,
                () => this.goToView('home'),
                (idx) => this.showReviewDetail(idx)
            );
        } else if (this.view === 'review_detail') {
            const idx = this.reviewQuestion;
            const q = this.questions[idx];
            const userAnswer = this.selectedAnswers[idx];
            this.el.innerHTML = Renderer.reviewDetail(
                q,
                idx,
                userAnswer,
                () => this.goToView('review')
            );
        }
    },

    // ===== Keyboard =====
    handleKeydown(e) {
        if (this.view !== 'quiz') return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const key = e.key;
        if (['1', '2', '3', '4'].includes(key)) {
            const idx = parseInt(key) - 1;
            const q = this.questions[this.currentQuestion];
            if (q && idx < q.options.length) {
                this.selectAnswer(idx);
            }
        } else if (key === 'Enter') {
            if (!this.isAnswered && this.selectedAnswers[this.currentQuestion] !== null) {
                this.checkAnswer();
            } else if (this.isAnswered) {
                this.nextQuestion();
            }
        } else if (key === 'ArrowLeft') {
            this.previousQuestion();
        } else if (key === 'ArrowRight') {
            if (this.isAnswered) {
                this.nextQuestion();
            }
        }
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }
};

// ============================================================
window.App = App;

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
