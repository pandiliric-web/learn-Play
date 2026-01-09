import Subject from '../models/Subject.js';

export async function getSubjects(req, res) {
  try {
    const subjects = await Subject.find({}).sort({ createdAt: 1 });
    return res.json({ data: subjects });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch subjects', error: err.message });
  }
}

export async function createSubject(req, res) {
  try {
    const { name, description, icon, color } = req.body || {};
    console.log('[subjects] createSubject called with body:', req.body);
    if (!name || !name.trim()) return res.status(400).json({ message: 'Subject name is required' });

    const newSubject = new Subject({
      name: name.trim(),
      description: (description || '').trim(),
      icon: icon || '📚',
      color: color || '#3498db'
    });

    const saved = await newSubject.save();
    console.log('[subjects] saved subject:', saved);
    return res.status(201).json({ data: saved });
  } catch (err) {
    console.error('[subjects] createSubject error:', err);
    return res.status(500).json({ message: 'Failed to create subject', error: err.message });
  }
}

export async function deleteSubject(req, res) {
  try {
    const { id } = req.params;
    console.log('[subjects] deleteSubject called for id:', id);
    const subject = await Subject.findById(id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    await Subject.findByIdAndDelete(id);
    console.log('[subjects] deleted subject id:', id);
    return res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    console.error('[subjects] deleteSubject error:', err);
    return res.status(500).json({ message: 'Failed to delete subject', error: err.message });
  }
}
