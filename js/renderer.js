const Renderer = {
    escape(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char]));
    },

    formatTime(seconds) {
        const total = Math.max(0, Math.floor(seconds));
        return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
    },

    home(manifest) {
        const sets = manifest.sets.map(set => `
            <button class="set-card" data-set-id="${this.escape(set.id)}">
                <span class="icon">${this.escape(set.icon || '📖')}</span>
                <span class="info">
                    <strong>${this.escape(set.label)}</strong>
                    <span class="count">${set.total || '?'} questions</span>
                </span>
                <span class="arrow" aria-hidden="true">→</span>
            </button>`).join('');
        return `<div class="card card-lg text-center fade-in home-card">
            <div class="home-icon" aria-hidden="true">📚</div>
            <h1 class="home-title">Medical Ethics Quiz</h1>
            <p class="home-subtitle">Select a question set to begin</p>
            <div class="set-list">${sets}</div>
            <button class="btn btn-secondary btn-block" onclick="App.openSettings()">⚙️ Settings</button>
        </div>`;
    },

    navigator(app, questions) {
        const buttons = questions.map((question, index) => {
            const answer = app.selectedAnswers[index];
            const checked = app.checkedAnswers[index];
            const status = !checked ? 'unanswered' :
                answer === question.correct ? 'correct' : 'incorrect';
            const current = index === app.currentQuestion ? ' current' : '';
            return `<button class="nav-btn ${status}${current}" onclick="App.goToQuestion(${index})"
                aria-label="Go to question ${index + 1}" ${current ? 'aria-current="step"' : ''}>${index + 1}</button>`;
        }).join('');
        return `<aside class="navigator-container" aria-label="Question navigator">
            <div class="navigator-heading">
                <span>📋 Question Navigator</span>
                <button class="navigator-close btn btn-sm btn-outline" onclick="App.toggleNavigator()" aria-label="Close navigator">×</button>
            </div>
            <div class="nav-grid">${buttons}</div>
        </aside>`;
    },

    quiz(app, questions) {
        const question = questions[app.currentQuestion];
        const current = app.currentQuestion + 1;
        const answer = app.selectedAnswers[app.currentQuestion];
        const checked = app.checkedAnswers[app.currentQuestion];
        const answeredCount = app.checkedAnswers.filter(Boolean).length;
        const progress = questions.length ? answeredCount / questions.length * 100 : 0;
        const isPersian = /[\u0600-\u06FF]/.test(question.question);
        const letters = isPersian ? ['الف', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح'] : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const options = question.options.map((option, index) => {
            const selected = answer === index ? ' selected' : '';
            const correct = checked && index === question.correct ? ' correct' : '';
            const wrong = checked && answer === index && answer !== question.correct ? ' wrong' : '';
            const status = checked && index === question.correct ? '✓' :
                checked && answer === index ? '✕' : '';
            return `<button class="option-card${selected}${correct}${wrong}" onclick="App.toggleOption(${index})"
                ${checked ? 'disabled' : ''} aria-pressed="${answer === index}">
                <span class="option-letter">${this.escape(letters[index] || index + 1)}</span>
                <span>${this.escape(option)}</span>
                ${status ? `<span class="status-icon" aria-hidden="true">${status}</span>` : ''}
            </button>`;
        }).join('');
        const feedback = checked ? `<div class="feedback ${answer === question.correct ? 'correct' : 'incorrect'}" role="status">
            <span class="icon">${answer === question.correct ? '✓' : '✕'}</span>
            <div><strong>${answer === question.correct ? 'Correct!' : 'Incorrect'}</strong>
            ${answer !== question.correct ? `<div>Correct answer: ${this.escape(letters[question.correct] || question.correct + 1)}</div>` : ''}
            ${app.settings.showExplanations && question.explanation ? `<div class="explanation"><strong>Explanation:</strong><p>${this.escape(question.explanation)}</p></div>` : ''}</div>
        </div>` : '';

        return `<div class="quiz-layout fade-in">
            <button class="navigator-open btn btn-secondary btn-sm" onclick="App.toggleNavigator()">☰ Questions</button>
            ${this.navigator(app, questions)}
            <main class="quiz-main">
                <div class="quiz-header">
                    <span class="title">${this.escape(question.category || 'Quiz')}</span>
                    <span class="progress-text">Question ${current} of ${questions.length}</span>
                    <span class="timer" data-timer>⏱ ${this.formatTime((Date.now() - app.startTime) / 1000)}</span>
                </div>
                <div class="progress-bar-container" aria-label="${Math.round(progress)}% complete"><div class="fill" style="width:${progress}%"></div></div>
                <section class="question-card" aria-labelledby="question-text">
                    <div class="question-number">Question ${current} of ${questions.length}</div>
                    ${question.category ? `<div class="category-tag">${this.escape(question.category)}</div>` : ''}
                    <h2 id="question-text" class="question-text">${this.escape(question.question)}</h2>
                    <div class="options-grid">${options}</div>
                    ${feedback}
                </section>
                ${!checked ? `<div class="check-answer-container"><button class="btn btn-primary" onclick="App.checkAnswer()" ${answer === null ? 'disabled' : ''}>Check Answer</button></div>` : ''}
                <div class="nav-buttons">
                    <button class="btn btn-outline" onclick="App.previousQuestion()" ${app.currentQuestion === 0 ? 'disabled' : ''}>← Previous</button>
                    <div class="right">
                        <button class="btn btn-outline" onclick="App.goHome()">⌂ Home</button>
                        ${checked ? `<button class="btn btn-primary" onclick="App.nextQuestion()">${current === questions.length ? 'Finish →' : 'Next →'}</button>` : ''}
                    </div>
                </div>
            </main>
        </div>`;
    },

    results(results) {
        return `<div class="card card-lg text-center fade-in results-card">
            <div class="home-icon" aria-hidden="true">🎉</div><h2>Quiz Complete</h2>
            <div class="result-number">${results.correct} / ${results.total}</div>
            <div class="result-percent">${results.percentage}%</div>
            <div class="stat-grid">
                <div class="stat-item"><div class="number">${results.correct}</div><div class="label">Correct</div></div>
                <div class="stat-item"><div class="number">${results.incorrect}</div><div class="label">Incorrect</div></div>
                <div class="stat-item"><div class="number">${results.unanswered}</div><div class="label">Unanswered</div></div>
                <div class="stat-item"><div class="number">${this.formatTime(results.timeTaken)}</div><div class="label">Time</div></div>
            </div>
            <div class="result-actions"><button class="btn btn-primary btn-block" onclick="App.goToView('review')">Review Answers</button>
            <button class="btn btn-secondary btn-block" onclick="App.restartQuiz()">Restart Quiz</button>
            <button class="btn btn-outline btn-block" onclick="App.goHome()">Back to Home</button></div>
        </div>`;
    },

    review(questions, answers) {
        const items = questions.map((question, index) => {
            const answer = answers[index];
            const status = answer === null ? 'unanswered' : answer === question.correct ? 'correct' : 'incorrect';
            return `<button class="review-item" onclick="App.showReviewDetail(${index})">
                <span class="status ${status}">${status === 'correct' ? '✓' : status === 'incorrect' ? '✕' : '•'}</span>
                <span class="q-text">${this.escape(question.question)}</span><span aria-hidden="true">→</span>
            </button>`;
        }).join('');
        return `<div class="fade-in"><div class="review-header"><h2>Review Answers</h2><button class="btn btn-secondary btn-sm" onclick="App.goHome()">⌂ Home</button></div>${items}</div>`;
    },

    reviewDetail(question, index, answer) {
        const correct = answer === question.correct;
        const options = question.options.map((option, optionIndex) => {
            const classes = optionIndex === question.correct ? ' correct-answer' :
                optionIndex === answer ? ' user-wrong' : '';
            return `<div class="review-detail-option${classes}"><strong>${optionIndex + 1})</strong> ${this.escape(option)}</div>`;
        }).join('');
        return `<div class="fade-in"><button class="btn btn-secondary btn-sm" onclick="App.goToView('review')">← Back to all questions</button>
            <div class="card review-detail"><h2>Question ${index + 1} <span class="${correct ? 'review-correct' : 'review-incorrect'}">${correct ? '✓ Correct' : '✕ Incorrect'}</span></h2>
            <p class="question-text">${this.escape(question.question)}</p>${options}
            ${App.settings.showExplanations && question.explanation ? `<div class="explanation"><strong>Explanation:</strong><p>${this.escape(question.explanation)}</p></div>` : ''}</div></div>`;
    },

    settingsModal(settings) {
        const toggle = (label, key) => `<div class="settings-toggle"><span>${label}</span><div class="toggle-track ${settings[key] ? 'active' : ''}" data-key="${key}" role="button" tabindex="0" aria-label="Toggle ${label}"><div class="toggle-thumb"></div></div></div>`;
        return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><h2 id="settings-title" class="modal-title">⚙️ Settings</h2>
            ${toggle('Shuffle questions', 'shuffleQuestions')}${toggle('Shuffle choices', 'shuffleChoices')}${toggle('Dark mode', 'darkMode')}${toggle('Show explanations', 'showExplanations')}
            <button class="btn btn-danger btn-block" onclick="if(confirm('Reset all saved progress?')) App.resetAllProgress()">🗑️ Reset saved progress</button>
            <button class="btn btn-secondary btn-block" onclick="App.closeSettings()">Close</button></div>`;
    },

    error(message) {
        return `<div class="card card-lg text-center error-card"><div class="home-icon">⚠️</div><h2>Unable to load questions</h2><p>${this.escape(message)}</p><button class="btn btn-primary" onclick="location.reload()">🔄 Retry</button></div>`;
    }
};

window.Renderer = Renderer;
