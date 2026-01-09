import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import WelcomeNotification from './WelcomeNotification';
import './Home.css';

const Home = () => {
  const subjects = [
    {
      id: 'math',
      name: 'Mathematics',
      icon: '🔢',
      color: '#FF6B6B',
      description: 'Learn numbers, shapes, and problem-solving through fun games!',
      path: '/math-game'
    },
    {
      id: 'filipino',
      name: 'Filipino',
      icon: '🇵🇭',
      color: '#4ECDC4',
      description: 'Explore Filipino language and culture with interactive activities!',
      path: '/filipino-game'
    },
    {
      id: 'english',
      name: 'English',
      icon: '🇺🇸',
      color: '#45B7D1',
      description: 'Improve English skills with vocabulary and grammar games!',
      path: '/english-game'
    }
  ];

  const features = [
    { icon: '🎮', title: 'Interactive Games', description: 'Learn through play with engaging activities' },
    { icon: '🏆', title: 'Earn Points', description: 'Track your progress and earn rewards' },
    { icon: '📚', title: 'Multiple Subjects', description: 'Math, Filipino, and English all in one place' },
    { icon: '🎯', title: 'Adaptive Learning', description: 'Games that adjust to your skill level' }
  ];

  return (
    <div className="home">
      <WelcomeNotification
        pageId="home"
        title="Kumusta! 👋"
        message="Pag-abot sa LearnPlay! Kini ang inyong lugar sa pagkat-on diin makakat-on mo sa Mathematics, Filipino, ug English pinaagi sa makalingaw nga mga dula ug quiz. I-klik ang 'Start Learning' aron makita ang mga subject o 'Take a Quiz' aron masulayan ang inyong kahibalo!"
        icon="👋"
      />
      {/* Hero Section */}
      <motion.section 
        className="hero"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-video">
          <video
            className="bg-video"
            src={process.env.PUBLIC_URL + '/bg.mp4'}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="video-overlay"></div>
        </div>
        <div className="hero-content">
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Welcome to <span className="highlight">LearnPlay</span>
          </motion.h1>
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Where learning meets fun! Discover Mathematics, Filipino, and English through exciting games and activities.
          </motion.p>
          <motion.div 
            className="hero-buttons"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link to="/subjects" className="btn btn-primary">
              Start Learning
            </Link>
            <Link to="/quiz" className="btn btn-secondary">
              Take a Quiz
            </Link>
          </motion.div>
        </div>
        <motion.div 
          className="hero-image"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          🎓🎮✨
        </motion.div>
      </motion.section>

      {/* Subjects Section */}
      <section className="subjects-section">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Choose Your Subject
          </motion.h2>
          <div className="subjects-grid">
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                className="subject-card"
                style={{ '--card-color': subject.color }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.05 }}
              >
                <div className="subject-icon">{subject.icon}</div>
                <h3 className="subject-name">{subject.name}</h3>
                <p className="subject-description">{subject.description}</p>
                <Link to={subject.path} className="subject-btn">
                  Start Learning
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Why Choose LearnPlay?
          </motion.h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="feature-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        className="cta-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <h2>Ready to Start Your Learning Journey?</h2>
          <p>Join thousands of students who are already learning and having fun!</p>
          <Link to="/subjects" className="btn btn-primary btn-large">
            Get Started Now
          </Link>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
