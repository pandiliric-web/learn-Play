import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const mammoth = require('mammoth');

/**
 * Extract text from PDF file
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Error parsing PDF: ${error.message}`);
  }
};

/**
 * Extract text from Word document
 */
const extractTextFromWord = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`Error parsing Word document: ${error.message}`);
  }
};

/**
 * Parse extracted text and convert to quiz questions
 * This parser looks for common question patterns:
 * - Numbered questions (1., 2., etc.)
 * - Multiple choice options (A., B., C., D. or a), b), c), d))
 * - True/False indicators
 * - Correct answer markers (Answer:, Correct answer:, etc.)
 */
const parseTextToQuestions = (text) => {
  const questions = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentQuestion = null;
  let currentOptions = [];
  let questionNumber = 1;
  let inQuestion = false;
  let inOptions = false;

  // Patterns to identify different question types
  const questionPattern = /^(\d+)[\.\)]\s*(.+)$/i;
  const optionPattern = /^([a-zA-Z])[\.\)]\s*(.+)$/;
  const trueFalsePattern = /^(true|false|t|f)\s*[\.:]?\s*(.+)$/i;
  const answerPattern = /^(answer|correct answer|key|solution)[\s:]+(.+)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for answer line (usually appears after options)
    const answerMatch = line.match(answerPattern);
    if (answerMatch && currentQuestion) {
      const answer = answerMatch[2].trim();
      // Try to match answer to option letter
      if (currentOptions.length > 0) {
        const optionIndex = answer.toLowerCase().charCodeAt(0) - 97; // a=0, b=1, etc.
        if (optionIndex >= 0 && optionIndex < currentOptions.length) {
          currentQuestion.answer = currentOptions[optionIndex];
        } else {
          currentQuestion.answer = answer;
        }
      } else {
        currentQuestion.answer = answer;
      }
      
      // Finalize current question
      if (currentQuestion.text) {
        questions.push(currentQuestion);
      }
      currentQuestion = null;
      currentOptions = [];
      inQuestion = false;
      inOptions = false;
      continue;
    }

    // Check for new question (numbered)
    const qMatch = line.match(questionPattern);
    if (qMatch) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.text) {
        questions.push(currentQuestion);
      }
      
      // Start new question
      const qNum = parseInt(qMatch[1]);
      const qText = qMatch[2];
      
      // Check if it's a true/false question
      const tfMatch = qText.match(/^(.+?)\s+(true|false|t|f)[\s\.:]?/i);
      
      if (tfMatch) {
        currentQuestion = {
          text: tfMatch[1].trim(),
          type: 'true-false',
          options: [],
          answer: tfMatch[2].toLowerCase().startsWith('t') ? 'True' : 'False'
        };
      } else {
        currentQuestion = {
          text: qText,
          type: 'multiple-choice',
          options: [],
          answer: ''
        };
      }
      
      currentOptions = [];
      inQuestion = true;
      inOptions = false;
      questionNumber = qNum;
      continue;
    }

    // Check for options (A., B., C., D. or a), b), c), d))
    const optMatch = line.match(optionPattern);
    if (optMatch && currentQuestion) {
      const optionLetter = optMatch[1].toLowerCase();
      const optionText = optMatch[2];
      
      // Only accept a-d options
      if (optionLetter >= 'a' && optionLetter <= 'd') {
        const optionIndex = optionLetter.charCodeAt(0) - 97;
        
        // Initialize options array if needed
        while (currentOptions.length <= optionIndex) {
          currentOptions.push('');
        }
        
        currentOptions[optionIndex] = optionText;
        inOptions = true;
        
        // If this is the last option we expect, update question
        if (optionLetter === 'd' || (optionLetter === 'c' && i < lines.length - 1)) {
          currentQuestion.options = currentOptions.filter(opt => opt.length > 0);
          currentQuestion.type = 'multiple-choice';
        }
      }
      continue;
    }

    // If we're in a question and haven't found options yet, continue appending to question text
    if (currentQuestion && !inOptions && line.length > 10) {
      // Check if this line looks like part of the question (not an option)
      if (!line.match(/^[a-zA-Z][\.\)]/)) {
        currentQuestion.text += ' ' + line;
      }
    }
  }

  // Save last question if exists
  if (currentQuestion && currentQuestion.text) {
    // If we collected options, add them
    if (currentOptions.length > 0) {
      currentQuestion.options = currentOptions.filter(opt => opt.length > 0);
      if (currentQuestion.options.length >= 2) {
        currentQuestion.type = 'multiple-choice';
        // If no answer set, default to first option
        if (!currentQuestion.answer && currentQuestion.options.length > 0) {
          currentQuestion.answer = currentQuestion.options[0];
        }
      }
    }
    
    // If no options and looks like true/false, convert
    if (currentQuestion.options.length === 0) {
      const lowerText = currentQuestion.text.toLowerCase();
      if (lowerText.includes('true') || lowerText.includes('false')) {
        currentQuestion.type = 'true-false';
        if (!currentQuestion.answer) {
          currentQuestion.answer = 'True';
        }
      } else {
        // Default to short-answer if we can't determine type
        currentQuestion.type = 'short-answer';
      }
    }
    
    questions.push(currentQuestion);
  }

  // Clean up questions
  return questions
    .filter(q => q.text && q.text.trim().length > 5) // Minimum question length
    .map((q, index) => ({
      text: q.text.trim(),
      type: q.type || 'multiple-choice',
      options: Array.isArray(q.options) ? q.options.filter(opt => opt.trim().length > 0) : [],
      answer: q.answer ? q.answer.trim() : (q.options && q.options[0] ? q.options[0].trim() : '')
    }));
};

/**
 * Main function to parse document and extract questions
 */
export const parseDocumentToQuestions = async (filePath, fileExtension) => {
  let text = '';

  try {
    // Extract text based on file type
    if (fileExtension === '.pdf') {
      text = await extractTextFromPDF(filePath);
    } else if (fileExtension === '.docx') {
      text = await extractTextFromWord(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the document');
    }

    // Parse text to questions
    const questions = parseTextToQuestions(text);

    if (questions.length === 0) {
      throw new Error('No questions could be extracted from the document. Please ensure the document follows a standard question format.');
    }

    return questions;
  } catch (error) {
    throw error;
  }
};

export default {
  parseDocumentToQuestions,
};
