// ===== Quiz (New Design) =====
quiz(state, questions, onSelect, onCheck, onNext, onPrev, onFinish, onNavigate) {
    const q = questions[state.currentQuestion];
    if (!q) return '<p>No question found.</p>';

    const total = questions.length;
    const current = state.currentQuestion + 1;
    const answer = state.selectedAnswers[state.currentQuestion];
    const isPersian = /[\u0600-\u06FF]/.test(q.question);

    const answeredCount = state.selectedAnswers.filter(a => a !== null).length;
    const progress = (answeredCount / total) * 100;

    // Format timer
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
                ${statusIcon ? `<span style="margin-left:auto;font-weight:700;font-size:18px;">${statusIcon}</span>` : ''}
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
                <div>
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
                <button class="btn btn-outline" onclick="App.previousQuestion()" ${state.currentQuestion === 0 ? 'disabled' : ''}>
                    ← Previous
                </button>

                ${state.isAnswered ? `
                    <button class="btn btn-primary" onclick="App.nextQuestion()">
                        ${state.currentQuestion === total - 1 ? 'Finish →' : 'Next →'}
                    </button>
                ` : ''}

                ${state.isAnswered && state.currentQuestion < total - 1 ? `
                    <button class="btn btn-outline" onclick="App.finishQuiz()" style="font-size:13px;">
                        Finish
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}
