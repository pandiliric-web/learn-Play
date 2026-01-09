import Quiz from '../models/Quiz.js';

const formatQuiz = (quiz) => ({
  id: quiz._id.toString(),
  title: quiz.title,
  subject: quiz.subject,
  difficulty: quiz.difficulty,
  description: quiz.description,
  icon: quiz.icon,
  color: quiz.color,
  questions: quiz.questions.map((question, idx) => ({
    id: `${quiz._id}-${idx}`,
    text: question.text,
    type: question.type,
    options: question.options,
    answer: question.answer,
  })),
  createdAt: quiz.createdAt,
  updatedAt: quiz.updatedAt,
});

const sanitizeQuestionPayload = (question) => ({
  text: (question.text || '').trim(),
  type: question.type || 'multiple-choice',
  options: Array.isArray(question.options)
    ? question.options.map((option) => (option || '').trim())
    : [],
  answer: (question.answer || '').trim(),
});

const sanitizeQuizPayload = (payload) => ({
  title: (payload.title || '').trim(),
  subject: (payload.subject || '').trim(),
  difficulty: (payload.difficulty || '').trim(),
  description: (payload.description || '').trim(),
  icon: (payload.icon || '').trim(),
  color: (payload.color || '').trim() || '#9b59b6',
  questions: Array.isArray(payload.questions)
    ? payload.questions.map(sanitizeQuestionPayload)
    : [],
});

export const getQuizzes = async (_req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json({ quizzes: quizzes.map(formatQuiz) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createQuiz = async (req, res) => {
  try {
    const payload = sanitizeQuizPayload(req.body);

    if (!payload.title || !payload.subject || !payload.difficulty) {
      return res.status(400).json({ message: 'Title, subject, and difficulty are required.' });
    }

    const quiz = await Quiz.create(payload);
    res.status(201).json({ quiz: formatQuiz(quiz) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = sanitizeQuizPayload(req.body);

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    quiz.title = payload.title || quiz.title;
    quiz.subject = payload.subject || quiz.subject;
    quiz.difficulty = payload.difficulty || quiz.difficulty;
    quiz.description = payload.description;
    quiz.icon = payload.icon;
    quiz.color = payload.color;
    quiz.questions = payload.questions;

    await quiz.save();

    res.json({ quiz: formatQuiz(quiz) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    await quiz.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
