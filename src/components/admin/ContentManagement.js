import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './ContentManagement.css';
import { subjectAPI } from '../../services/api';

// Helper function to map subject names for display
const getDisplayName = (name) => {
  if (!name) return name;
  const upperName = name.toUpperCase().trim();
  if (upperName === 'PH') return 'Filipino';
  if (upperName === 'US') return 'English';
  return name;
};

// Helper function to get appropriate icon based on subject name
const getSubjectIcon = (name, currentIcon) => {
  if (!name) return currentIcon || '📚';
  const upperName = name.toUpperCase().trim();
  if (upperName === 'PH' || upperName === 'FILIPINO') return '📝'; // Writing/book icon for Filipino
  if (upperName === 'US' || upperName === 'ENGLISH') return '✍️'; // Writing hand icon for English
  return currentIcon || '📚';
};

const ContentManagement = ({ onSubjectsChanged } = {}) => {
  const [activeTab, setActiveTab] = useState('subjects');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'subjects', label: 'Subjects', icon: '📚' }
  ];

  // Load subjects from server and normalize id field
  useEffect(() => {
    let mounted = true;
    async function loadSubjects() {
      try {
        const res = await subjectAPI.getSubjects();
        if (!mounted) return;
        if (!res.ok) throw new Error('Failed to fetch subjects');
        const json = await res.json();
        const data = (json.data || []).map((s) => ({
          id: s._id || s.id,
          name: s.name,
          description: s.description,
          icon: s.icon || '📚',
          color: s.color || '#3498db',
          gamesCount: s.gamesCount || 0,
          quizzesCount: s.quizzesCount || 0,
          lessonsCount: s.lessonsCount || 0,
          isActive: typeof s.isActive === 'boolean' ? s.isActive : true
        }));
        setSubjects(data);
      } catch (err) {
        console.error('Error loading subjects', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSubjects();
    return () => { mounted = false; };
  }, []);


  // CRUD Functions
  const handleAddSubject = async (newSubject) => {
    try {
      const payload = {
        name: newSubject.name,
        description: newSubject.description,
        icon: newSubject.icon,
        color: newSubject.color
      };
      const res = await subjectAPI.createSubject(payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create subject');
      }
      const json = await res.json();
      const saved = json.data;
      const normalized = {
        id: saved._id || saved.id,
        name: saved.name,
        description: saved.description,
        icon: saved.icon || '📚',
        color: saved.color || '#3498db',
        gamesCount: saved.gamesCount || 0,
        quizzesCount: saved.quizzesCount || 0,
        lessonsCount: saved.lessonsCount || 0,
        isActive: typeof saved.isActive === 'boolean' ? saved.isActive : true
      };
      setSubjects((prev) => [...prev, normalized]);
      if (typeof onSubjectsChanged === 'function') onSubjectsChanged();
      setShowAddModal(false);
      alert('Subject added successfully!');
    } catch (err) {
      console.error('Add subject failed', err);
      // Show server-provided message when available so user knows the reason
      alert(err?.message || 'Could not add subject. See console for details.');
    }
  };

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject);
    setShowEditModal(true);
  };

  const handleUpdateSubject = (updatedSubject) => {
    setSubjects(subjects.map(subject => 
      subject.id === updatedSubject.id ? updatedSubject : subject
    ));
    setShowEditModal(false);
    setSelectedSubject(null);
    alert('Subject updated successfully!');
    if (typeof onSubjectsChanged === 'function') onSubjectsChanged();
  };

  const handleDeleteSubject = (subjectId) => {
    (async () => {
      if (!window.confirm('Are you sure you want to delete this subject?')) return;
      try {
        const res = await subjectAPI.deleteSubject(subjectId);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to delete subject');
        }
        setSubjects((prev) => prev.filter(subject => subject.id !== subjectId));
        if (typeof onSubjectsChanged === 'function') onSubjectsChanged();
        alert('Subject deleted successfully!');
      } catch (err) {
        console.error('Delete subject failed', err);
        alert(err?.message || 'Could not delete subject. See console for details.');
      }
    })();
  };

  const handleViewSubject = (subject) => {
    alert(`Viewing details for ${getDisplayName(subject.name)}\n\nDescription: ${subject.description}\nGames: ${subject.gamesCount}\nQuizzes: ${subject.quizzesCount}\nLessons: ${subject.lessonsCount}`);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner">Loading subjects...</div>
        </div>
      );
    }
    
    return (
      <SubjectsContent 
        subjects={subjects}
        onEdit={handleEditSubject}
        onDelete={handleDeleteSubject}
        onView={handleViewSubject}
      />
    );
  };

  return (
    <div className="content-management">
      <div className="content-header">
        <h2>Content Management</h2>
        <button 
          className="add-btn"
          onClick={() => setShowAddModal(true)}
        >
          ➕ Add New
        </button>
      </div>


      <div className="content-body">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div>

      {showAddModal && (
        <AddSubjectModal
          onSave={handleAddSubject}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && (
        <EditSubjectModal
          subject={selectedSubject}
          onSave={handleUpdateSubject}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSubject(null);
          }}
        />
      )}
    </div>
  );
};

const SubjectsContent = ({ subjects, onEdit, onDelete, onView }) => (
  <div className="subjects-grid">
    {subjects.map(subject => (
      <motion.div
        key={subject.id}
        className="subject-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="subject-header">
          <div 
            className="subject-icon"
            style={{ backgroundColor: subject.color }}
          >
            {getSubjectIcon(subject.name, subject.icon)}
          </div>
          <div className="subject-info">
            <h3>{getDisplayName(subject.name)}</h3>
            <p>{subject.description}</p>
          </div>
          <div className="subject-status">
            <span className={`status-badge ${subject.isActive ? 'active' : 'inactive'}`}>
              {subject.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <div className="subject-stats">
          <div className="stat">
            <span className="stat-number">{subject.gamesCount}</span>
            <span className="stat-label">Games</span>
          </div>
          <div className="stat">
            <span className="stat-number">{subject.quizzesCount}</span>
            <span className="stat-label">Quizzes</span>
          </div>
          <div className="stat">
            <span className="stat-number">{subject.lessonsCount}</span>
            <span className="stat-label">Lessons</span>
          </div>
        </div>
        
        <div className="subject-actions">
          <button 
            className="btn-edit"
            onClick={() => onEdit(subject)}
          >
            ✏️ Edit
          </button>
          <button 
            className="btn-view"
            onClick={() => onView(subject)}
          >
            👁️ View
          </button>
          <button 
            className="btn-delete"
            onClick={() => onDelete(subject.id)}
          >
            🗑️ Delete
          </button>
        </div>
      </motion.div>
    ))}
  </div>
);


const AddSubjectModal = ({ onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📚',
    color: '#3498db'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const iconOptions = ['🔢', '📝', '✍️', '📚', '📖', '✏️', '🎯', '🌟'];
  const colorOptions = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Subject</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subject Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter subject name" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter subject description" 
              rows="3"
              required
            ></textarea>
          </div>
          <div className="form-group">
            <label>Icon</label>
            <div className="icon-selector">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  type="button"
                  className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Color</label>
            <div className="color-selector">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-save">Create Subject</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditSubjectModal = ({ subject, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: subject?.name || '',
    description: subject?.description || '',
    icon: subject?.icon || '📚',
    color: subject?.color || '#3498db',
    isActive: subject?.isActive ?? true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...subject, ...formData });
  };

  const iconOptions = ['🔢', '📝', '✍️', '📚', '📖', '✏️', '🎯', '🌟'];
  const colorOptions = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Subject</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subject Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter subject name" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter subject description" 
              rows="3"
              required
            ></textarea>
          </div>
          <div className="form-group">
            <label>Icon</label>
            <div className="icon-selector">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  type="button"
                  className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Color</label>
            <div className="color-selector">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
            >
              <option value={true}>Active</option>
              <option value={false}>Inactive</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-save">Update Subject</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentManagement;
