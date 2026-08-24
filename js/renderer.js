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
                <p style="color:var(--text-secondary);margin:8px 0 24px;">
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

    // ===== Quiz =====
    quiz(state, questions, onSelect, onCheck, onNext, onPrev, onFinish, onNavigate) {
        const q = questions[state.currentQuestion];
        if (!q) return '<p>No question found.</p>';

        const total = questions.length;
        const answer = state.selectedAnswers[state.currentQuestion];
        const isPersian = /[\u0600-\u06FF]/.test(q.question);
        const letters = isPersian ? ['الف', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ی'] :
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

        const answeredCount = state.selectedAnswers.filter(a => a !== null).length;
        const progress = (answeredCount / total) * 100;

        // Options
        let optionsHtml = q.options.map((opt, idx) => {
            let classes = 'option-btn';
            if (state.isAnswered) {
                classes += ' disabled';
                if (idx === q.correct) classes += ' correct';
                if (idx === answer && answer !== q.correct) classes += ' wrong';
            } else {
                if (answer === idx) classes += ' selected';
            }

            let statusIcon = '';
            if (state.isAnswered) {
                if (idx === q.correct) statusIcon = ' ✓';
                else if (idx === answer && answer !== q.correct) statusIcon = ' ✕';
            }

            return `
                <button class="${classes}" onclick="App.selectAnswer(${idx})" ${state.isAnswered ? 'disabled' : ''}>
                    <span class="letter">${letters[idx] || (idx + 1)})</span>
                    <span>${opt}</span>
                    ${statusIcon ? `<span style="margin-left:auto;font-weight:700;">${statusIcon}</span>` : ''}
                </button>
            `;
        }).join('');

        // Feedback
        let feedbackHtml = '';
        if (state.isAnswered) {
            const isCorrect = state.isCorrect;
            const correctLetter = letters[q.correct] || (q.correct + 1);
            const settings = Storage.getSettings();
            feedbackHtml = `
                <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
                    <div class="title">${isCorrect ? '✓ Correct!' : '✕ Incorrect'}</div>
                    ${!isCorrect ? `<p style="margin-top:4px;">Correct answer: ${correctLetter}</p>` : ''}
                    ${settings.showExplanations && q.explanation ? `
                        <div class="explanation">
                            <strong>Explanation:</strong>
                            <p style="margin-top:4px;">${q.explanation}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Navigator
        let navHtml = this.navigator(questions, state.currentQuestion, state.selectedAnswers, onNavigate);

        return `
            <div class="fade-in">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="font-weight:600;color:var(--text-secondary);">Medical Ethics Quiz</span>
                    <span style="font-size:14px;color:var(--text-muted);">Question ${state.currentQuestion + 1} / ${total}</span>
                </div>

                <div class="progress-track" style="margin-bottom:16px;">
                    <div class="progress-fill" style="width:${progress}%;"></div>
                </div>

                ${navHtml}

                <div class="card" style="margin-top:16px;">
                    <div style="margin-bottom:16px;">
                        <div style="font-size:14px;color:var(--text-muted);margin-bottom:4px;">
                            Question ${state.currentQuestion + 1} of ${total}
                        </div>
                        <h3 style="font-size:1.25rem;line-height:1.7;">${q.question}</h3>
                        ${q.category ? `<span style="display:inline-block;margin-top:8px;font-size:12px;background:var(--accent-light);color:var(--accent);padding:2px 12px;border-radius:999px;">${q.category}</span>` : ''}
                    </div>

                    <div style="display:flex;flex-direction:column;gap:8px;">
                        ${optionsHtml}
                    </div>

                    ${feedbackHtml}
                </div>

                <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;margin-top:16px;align-items:center;">
                    <button class="btn btn-secondary" onclick="App.previousQuestion()" ${state.currentQuestion === 0 ? 'disabled' : ''}>
                        ← Previous
                    </button>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${!state.isAnswered ? `
                            <button class="btn btn-primary" onclick="App.checkAnswer()" ${answer === null ? 'disabled' : ''}>
                                Check Answer
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="App.nextQuestion()">
                                ${state.currentQuestion === total - 1 ? 'Finish Quiz →' : 'Next →'}
                            </button>
                        `}
                    </div>

                    ${state.isAnswered && state.currentQuestion < total - 1 ? `
                        <button class="btn btn-outline btn-sm" onclick="App.finishQuiz()" style="font-size:13px;">
                            Finish
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // ===== Navigator =====
    navigator(questions, currentIndex, selectedAnswers, onNavigate) {
        let html = `<div class="nav-grid" role="navigation" aria-label="Question navigator">`;
        for (let i = 0; i < questions.length; i++) {
            const answer = selectedAnswers[i];
            let status = 'unanswered';
            if (answer !== null) {
                status = answer === questions[i].correct ? 'correct' : 'incorrect';
            }
            const isCurrent = i === currentIndex;
            let cls = 'nav-btn';
            if (isCurrent) cls += ' current';
            if (status === 'correct') cls += ' correct';
            else if (status === 'incorrect') cls += ' incorrect';
            else cls += ' unanswered';

            html += `
                <button class="${cls}" onclick="App.goToQuestion(${i})" aria-label="Go to question ${i+1}" ${isCurrent ? 'aria-current="step"' : ''}>
                    ${i+1}
                </button>
            `;
        }
        html += '</div>';
        return html;
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
                <h2 style="font-size:2rem;font-weight:700;margin-bottom:12px;">Quiz Complete</h2>

                <div style="margin:24px 0;">
                    <div class="result-number">${results.correct} / ${results.total}</div>
                    <div style="font-size:1.5rem;color:var(--text-secondary);">${results.percentage}%</div>
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
                    <h2 style="font-size:1.5rem;font-weight:700;">Review Answers</h2>
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
                        <h3 style="font-size:1.25rem;font-weight:700;">Question ${idx + 1}</h3>
                        <span style="padding:4px 12px;border-radius:999px;font-size:14px;font-weight:600;${isCorrect ? 'background:var(--success-light);color:var(--success)' : 'background:var(--danger-light);color:var(--danger)'}">
                            ${isCorrect ? '✓ Correct' : '✕ Incorrect'}
                        </span>
                    </div>

                    <p style="font-size:1.1rem;margin-bottom:16px;">${question.question}</p>

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

    // ===== Loading =====
    loading() {
        return `
            <div style="text-align:center;padding:60px 20px;">
                <div style="font-size:2rem;margin-bottom:16px;">📚</div>
                <div style="font-size:1.2rem;color:var(--text-secondary);">Loading questions...</div>
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
