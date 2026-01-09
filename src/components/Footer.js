import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const auth = useAuth() || {};
  const user = auth.user || null;

  return (
    <motion.footer 
      className="footer"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <div className="logo-icon">🎮</div>
              <div className="logo-text">
                <h3>LearnPlay</h3>
                <p>Lambajon Elementary School</p>
              </div>
            </div>
            <p className="footer-description">
              An interactive e-learning platform designed to make learning fun and engaging for elementary students.
            </p>
          </div>

          <div className="footer-section">
            <h4>Learning Subjects</h4>
            <ul className="footer-links">
              <li><Link to="/math-game">Mathematics</Link></li>
              <li><Link to="/filipino-game">Filipino</Link></li>
              <li><Link to="/english-game">English</Link></li>
              <li><Link to="/subjects">All Subjects</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Activities</h4>
            <ul className="footer-links">
              <li><Link to="/quiz">Interactive Quizzes</Link></li>
              {user && (user.role === 'teacher' || user.role === 'admin') && (
                <li><Link to="/progress">Progress Tracking</Link></li>
              )}
              <li><Link to="/subjects">Educational Games</Link></li>
              <li><Link to="/">Learning Resources</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/subjects">Start Learning</Link></li>
              <li><Link to="/quiz">Take a Quiz</Link></li>
              {user && (user.role === 'teacher' || user.role === 'admin') && (
                <li><Link to="/progress">View Progress</Link></li>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-info">
            <p>&copy; {currentYear} LearnPlay. All rights reserved.</p>
            <p>Designed for Lambajon Elementary School Students</p>
          </div>
          <div className="footer-social">
            <span className="social-text">Learning is Fun! 🎓✨</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
