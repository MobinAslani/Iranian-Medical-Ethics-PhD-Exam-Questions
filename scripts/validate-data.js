const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const errors = [];
const ids = new Set();

for (const set of manifest.sets || []) {
    if (ids.has(set.id)) errors.push(`Duplicate set id: ${set.id}`);
    ids.add(set.id);
    const file = path.join(root, set.file);
    if (!fs.existsSync(file)) {
        errors.push(`${set.id}: missing file ${set.file}`);
        continue;
    }
    const questions = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(questions) || questions.length === 0) {
        errors.push(`${set.id}: question file must contain at least one question`);
        continue;
    }
    if (set.total !== questions.length) {
        errors.push(`${set.id}: manifest total ${set.total} does not match ${questions.length}`);
    }
    const questionIds = new Set();
    questions.forEach((question, index) => {
        const prefix = `${set.id} question ${index + 1}`;
        if (questionIds.has(question.id)) errors.push(`${prefix}: duplicate id ${question.id}`);
        questionIds.add(question.id);
        if (!question.question || !Array.isArray(question.options) || question.options.length < 2) {
            errors.push(`${prefix}: missing question text or options`);
        }
        if (!Number.isInteger(question.correct) ||
            question.correct < 0 || question.correct >= question.options.length) {
            errors.push(`${prefix}: invalid correct option index`);
        }
    });
}

if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
} else {
    console.log(`Validated ${manifest.sets.length} sets successfully.`);
}
