// ===== UI Rendering Functions =====

const Renderer = {
    // ===== Home =====
    home(manifest, onSelectSet, onSettings) {
        const setsHtml = manifest.sets.map(set => `
            <button class="set-card" data-set-id="${set.id}">
                <span class="icon">${set.icon || '📖'}</span>
                <span class="info">
                    <div style="font-weight:600;">${set.label}</div>
                    <div class="count">${set.total || '?'} questions</div>
                </span>
                <span class="arrow">→</span>
            </button>
        `).join('');

        return `
            <div class="card card-lg text-center fade-in" style="max-width:600px;margin:0 auto;">
                <div style="font-size:3rem;margin-bottom:8px;">📚</div>
                <h1 class="home-title">Medical Ethics Quiz</h1>
                <p style="color:var(--text-secondary);margin:8px 0 24px;font-size:15px;">
                    Select a question set to begin
                </p>

                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px;">
                    ${setsHtml}
                </div>

                <button class="btn btn-secondary btn-block" onclick="App.openSettings()">
                    ⚙️ Settings
                </button>
            </div>
        `;
    },

    // ===== Quiz (New UI Design) =====
    quiz(state, questions, onSelect, onCheck, onNext, onPrev, onFinish, onNavigate) {
        const q = questions[state.currentQuestion];
        if (!q) return '<p>No question found.</p>';

        const total = questions.length;
        const current = state.currentQuestion + 1;
        const answer = state.selectedAnswers[state.currentQuestion];
        const isPersian = /[\u0600-\u06FF]/.test(q.question);

        const answeredCount = state.selectedAnswers.filter(a => a !== null).length;
        const progress = (answeredCount / total) * 100;

        // Timer
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const timerStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        // Options
        let optionsHtml = q.options.map((opt, idx) => {
            let classes = 'option-card';
            if (state.isAnswered) {
                classes += ' disabled';
                if (idx === q.correct) classes += ' correct';
                if (idx === answer && answer !== q.correct) classes += ' wrong';
            } else {
                if (answer === idx) classes += ' selected';
            }

            let statusIcon = '';
            if (state.isAnswered) {
                if (idx === q.correct) statusIcon = '✓';
                else if (idx === answer && answer !== q.correct) statusIcon = '✕';
            }

            return `
                <div class="${classes}" onclick="App.selectAnswer(${idx})" ${state.isAnswered ? 'style="pointer-events:none;"' : ''}>
                    <div class="radio">
                        <div class="dot"></div>
                    </div>
                    <span>${opt}</span>
                    ${statusIcon ? `<span class="status-icon">${statusIcon}</span>` : ''}
                </div>
            `;
        }).join('');

        // Feedback
        let feedbackHtml = '';
        if (state.isAnswered) {
            const isCorrect = state.isCorrect;
            const settings = Storage.getSettings();
            feedbackHtml = `
                <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
                    <span class="icon">${isCorrect ? '✓' : '✕'}</span>
                    <div style="flex:1;">
                        <div style="font-weight:600;">${isCorrect ? 'Correct!' : 'Incorrect'}</div>
                        ${!isCorrect ? `<div style="font-size:14px;color:var(--text-secondary);">Correct answer: Option ${q.correct + 1}</div>` : ''}
                        ${settings.showExplanations && q.explanation ? `
                            <div class="explanation">
                                <strong>Explanation:</strong>
                                <p style="margin-top:4px;">${q.explanation}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="fade-in">
                <!-- Top Bar -->
                <div class="quiz-header">
                    <span class="title">${q.category || 'Quiz'}</span>
                    <span class="progress-text">Questions ${current} of ${total}</span>
                    <span class="timer">⏱ ${timerStr}</span>
                </div>

                <!-- Progress Bar -->
                <div class="progress-bar-container">
                    <div class="fill" style="width:${progress}%;"></div>
                </div>

                <!-- Question Card -->
                <div class="question-card">
                    <div class="question-number">Question ${current} of ${total}</div>
                    ${q.category ? `<div class="category-tag">${q.category}</div>` : ''}
                    <div class="question-text">${q.question}</div>

                    <!-- Options -->
                    <div class="options-grid">
                        ${optionsHtml}
                    </div>

                    ${feedbackHtml}
                </div>

                <!-- Check Answer Button -->
                ${!state.isAnswered ? `
                    <div class="check-answer-container">
                        <button class="btn btn-primary" onclick="App.checkAnswer()" ${answer === null ? 'disabled' : ''}>
                            Check Answer
                        </button>
                    </div>
                ` : ''}

                <!-- Navigation -->
                <div class="nav-buttons">
                    <div class="left">
                        <button class="btn btn-outline" onclick="App.previousQuestion()" ${state.currentQuestion === 0 ? 'disabled' : ''}>
                            ← Previous
                        </button>
                    </div>
                    <div class="right">
                        ${state.isAnswered ? `
                            <button class="btn btn-primary" onclick="App.nextQuestion()">
                                ${state.currentQuestion === total - 1 ? 'Finish →' : 'Next →'}
                            </button>
                        ` : ''}
                        ${state.isAnswered && state.currentQuestion < total - 1 ? `
                            <button class="btn btn-outline btn-sm" onclick="App.finishQuiz()">
                                Finish
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    // ===== Results =====
    results(results, onReview, onRestart, onHome) {
        const formatTime = (s) => {
            const m = Math.floor(s / 60);
            const sec = s % 60;
            return `${m}:${sec.toString().padStart(2, '0')}`;
        };

        return `
            <div class="card card-lg text-center fade-in" style="max-width:600px;margin:0 auto;">
                <div style="font-size:3rem;margin-bottom:8px;">🎉</div>
                <h2 style="font-size:1.8rem;font-weight:700;margin-bottom:12px;">Quiz Complete</h2>

                <div style="margin:24px 0;">
                    <div class="result-number">${results.correct} / ${results.total}</div>
                    <div style="font-size:1.3rem;color:var(--text-secondary);">${results.percentage}%</div>
                </div>

                <div class="stat-grid" style="margin-bottom:24px;">
                    <div class="stat-item">
                        <div class="number" style="color:var(--success);">${results.correct}</div>
                        <div class="label">Correct</div>
                    </div>
                    <div class="stat-item">
                        <div class="number" style="color:var(--danger);">${results.incorrect}</div>
                        <div class="label">Incorrect</div>
                    </div>
                    <div class="stat-item">
                        <div class="number" style="color:var(--text-muted);">${results.unanswered}</div>
                        <div class="label">Unanswered</div>
                    </div>
                    <div class="stat-item">
                        <div class="number" style="color:var(--accent);">${formatTime(results.timeTaken)}</div>
                        <div class="label">Time</div>
                    </div>
                </div>

                <div style="display:flex;flex-direction:column;gap:10px;">
                    <button class="btn btn-primary btn-block" onclick="App.goToView('review')">
                        Review Answers
                    </button>
                    <button class="btn btn-secondary btn-block" onclick="App.restartQuiz()">
                        Restart Quiz
                    </button>
                    <button class="btn btn-outline btn-block" onclick="App.goToView('home')">
                        Back to Home
                    </button>
                </div>
            </div>
        `;
    },

    // ===== Review =====
    review(questions, selectedAnswers, onBack, onQuestionClick) {
        let itemsHtml = questions.map((q, idx) => {
            const answer = selectedAnswers[idx];
            let status = 'unanswered';
            let statusText = '•';
            let statusClass = 'unanswered';
            if (answer !== null) {
                if (answer === q.correct) {
                    status = 'correct';
                    statusText = '✓';
                    statusClass = 'correct';
                } else {
                    status = 'incorrect';
                    statusText = '✕';
                    statusClass = 'incorrect';
                }
            }

            return `
                <div class="review-item" onclick="App.showReviewDetail(${idx})">
                    <span class="status ${statusClass}">${statusText}</span>
                    <span class="q-text">${q.question}</span>
                    <span style="font-size:12px;color:var(--text-muted);">→</span>
                </div>
            `;
        }).join('');

        return `
            <div class="fade-in">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h2 style="font-size:1.3rem;font-weight:700;">Review Answers</h2>
                    <button class="btn btn-secondary btn-sm" onclick="App.goToView('home')">
                        ← Home
                    </button>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${itemsHtml}
                </div>
            </div>
        `;
    },

    // ===== Review Detail =====
    reviewDetail(question, idx, userAnswer, onBack) {
        const isCorrect = userAnswer === question.correct;
        const isPersian = /[\u0600-\u06FF]/.test(question.question);
        const letters = isPersian ? ['الف', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ی'] :
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

        let optionsHtml = question.options.map((opt, i) => {
            let classes = 'review-detail-option';
            if (i === question.correct) classes += ' correct-answer';
            if (userAnswer === i && i !== question.correct) classes += ' user-wrong';

            let label = '';
            if (i === question.correct) label = ' ✓ (Correct)';
            if (userAnswer === i && i !== question.correct) label = ' ✕ (Your answer)';

            return `
                <div class="${classes}">
                    <span style="font-weight:600;">${letters[i] || (i+1)})</span> ${opt}
                    <span style="font-weight:600;${i === question.correct ? 'color:var(--success)' : 'color:var(--danger)'}">${label}</span>
                </div>
            `;
        }).join('');

        const settings = Storage.getSettings();

        return `
            <div class="fade-in">
                <button class="btn btn-secondary btn-sm" onclick="App.goToView('review')" style="margin-bottom:16px;">
                    ← Back to all questions
                </button>

                <div class="card">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
                        <h3 style="font-size:1.1rem;font-weight:700;">Question ${idx + 1}</h3>
                        <span style="padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;${isCorrect ? 'background:var(--success-light);color:var(--success)' : 'background:var(--danger-light);color:var(--danger)'}">
                            ${isCorrect ? '✓ Correct' : '✕ Incorrect'}
                        </span>
                    </div>

                    <p style="font-size:1.05rem;margin-bottom:16px;">${question.question}</p>

                    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
                        ${optionsHtml}
                    </div>

                    ${settings.showExplanations && question.explanation ? `
                        <div style="border-top:1px solid var(--border-color);padding-top:16px;">
                            <h4 style="font-weight:600;margin-bottom:8px;">Explanation</h4>
                            <p style="color:var(--text-secondary);line-height:1.7;">${question.explanation}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // ===== Settings Modal =====
    settingsModal(settings, onToggle, onReset) {
        const renderToggle = (label, key, value) => `
            <div class="settings-toggle">
                <span>${label}</span>
                <div class="toggle-track ${value ? 'active' : ''}" data-key="${key}" role="button" tabindex="0" aria-label="Toggle ${label}">
                    <div class="toggle-thumb"></div>
                </div>
            </div>
        `;

        return `
            <div class="modal">
                <h2 class="modal-title">⚙️ Settings</h2>

                <div style="display:flex;flex-direction:column;gap:12px;">
                    ${renderToggle('Shuffle questions', 'shuffleQuestions', settings.shuffleQuestions)}
                    ${renderToggle('Shuffle choices', 'shuffleChoices', settings.shuffleChoices)}
                    ${renderToggle('Dark mode', 'darkMode', settings.darkMode)}
                    ${renderToggle('Show explanations', 'showExplanations', settings.showExplanations)}

                    <div style="border-top:1px solid var(--border-color);padding-top:16px;margin-top:4px;">
                        <button class="btn btn-danger btn-block" onclick="if(confirm('Reset all saved progress? This action cannot be undone.')) { App.resetAllProgress(); }">
                            🗑️ Reset saved progress
                        </button>
                    </div>
                </div>

                <button class="btn btn-secondary btn-block" onclick="App.closeSettings()" style="margin-top:16px;">
                    Close
                </button>
            </div>
        `;
    },

    // ===== Error =====
    error(message) {
        return `
            <div class="card card-lg text-center" style="max-width:500px;margin:40px auto;border-color:var(--danger);">
                <div style="font-size:3rem;margin-bottom:12px;">⚠️</div>
                <h3 style="font-weight:700;margin-bottom:8px;">Error Loading Questions</h3>
                <p style="color:var(--text-muted);">${message}</p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top:16px;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
};

window.Renderer = Renderer;
