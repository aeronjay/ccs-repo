const express = require('express');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit (GridFS chunk limit)
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF and DOCX files
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
  }
});

// Initialize GridFS
let gfs;
mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'papers'
  });
});

// Upload paper
router.post('/upload', upload.single('paper'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }    const { userId, title, description, journal, year, authors, tags, doi } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Parse JSON fields
    let parsedAuthors = [];
    let parsedTags = [];
    
    try {
      if (authors) parsedAuthors = JSON.parse(authors);
      if (tags) parsedTags = JSON.parse(tags);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid authors or tags format' });
    }

    // Create upload stream
    const uploadStream = gfs.openUploadStream(req.file.originalname, {
      metadata: {
        userId: userId,
        title: title || req.file.originalname,
        description: description || '',
        journal: journal || '',
        year: year || new Date().getFullYear().toString(),
        authors: parsedAuthors,
        tags: parsedTags,
        doi: doi || `DOI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        uploadDate: new Date(),
        contentType: req.file.mimetype,
        size: req.file.size,
        // Add default ratings for homepage display
        impact: 0,
        clarity: 0,
        likes: 0,
        comments: 0
      }
    });

    // Handle upload completion
    uploadStream.on('finish', () => {
      res.status(201).json({
        message: 'File uploaded successfully',
        fileId: uploadStream.id,
        filename: req.file.originalname,
        size: req.file.size
      });
    });

    // Handle upload error
    uploadStream.on('error', (error) => {
      res.status(500).json({ message: 'Upload failed', error: error.message });
    });

    // Write file to GridFS
    uploadStream.end(req.file.buffer);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's papers
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const files = await gfs.find({ 'metadata.userId': userId }).toArray();
      const papers = files.map(file => ({
      id: file._id,
      filename: file.filename,
      title: file.metadata.title,
      description: file.metadata.description,
      journal: file.metadata.journal,
      year: file.metadata.year,
      authors: file.metadata.authors || [],
      tags: file.metadata.tags || [],
      doi: file.metadata.doi,
      uploadDate: file.metadata.uploadDate,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      impact: file.metadata.impact || 0,
      clarity: file.metadata.clarity || 0,
      likes: file.metadata.likes || 0,
      comments: file.metadata.comments || 0
    }));

    res.json(papers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Download paper
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.query;

    // Find the file
    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = files[0];

    // Check if user owns the file (optional security check)
    if (userId && file.metadata.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Set response headers
    res.set({
      'Content-Type': file.metadata.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`
    });

    // Create download stream
    const downloadStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    
    downloadStream.on('error', (error) => {
      res.status(500).json({ message: 'Download failed', error: error.message });
    });

    // Pipe the file to response
    downloadStream.pipe(res);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete paper
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.body;

    // Find the file first to check ownership
    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = files[0];

    // Check if user owns the file
    if (file.metadata.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete the file
    await gfs.delete(new mongoose.Types.ObjectId(fileId));
    
    res.json({ message: 'File deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all papers for public display (homepage)
router.get('/public', async (req, res) => {
  try {
    const files = await gfs.find({}).toArray();
    
    const papers = files.map(file => ({
      id: file._id,
      title: file.metadata.title,
      journal: file.metadata.journal || 'Unknown Journal',
      year: file.metadata.year || new Date().getFullYear().toString(),
      doi: file.metadata.doi || 'DOI link',
      authors: file.metadata.authors || [],
      abstract: file.metadata.description || 'No abstract available.',
      tags: file.metadata.tags || [],
      impact: file.metadata.impact || (Math.random() * 2 + 3).toFixed(1), // Random rating 3-5
      clarity: file.metadata.clarity || (Math.random() * 2 + 3).toFixed(1), // Random rating 3-5
      likes: file.metadata.likes || Math.floor(Math.random() * 200),
      comments: file.metadata.comments || Math.floor(Math.random() * 5),
      uploadDate: file.metadata.uploadDate,
      filename: file.filename,
      size: file.metadata.size
    }));

    res.json(papers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all papers (for admin)
router.get('/admin/all', async (req, res) => {
  try {
    const files = await gfs.find({}).toArray();
    
    const papers = files.map(file => ({
      id: file._id,
      filename: file.filename,
      title: file.metadata.title,
      description: file.metadata.description,
      journal: file.metadata.journal,
      year: file.metadata.year,
      authors: file.metadata.authors || [],
      tags: file.metadata.tags || [],
      doi: file.metadata.doi,
      userId: file.metadata.userId,
      uploadDate: file.metadata.uploadDate,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      impact: file.metadata.impact || 0,
      clarity: file.metadata.clarity || 0,
      likes: file.metadata.likes || 0,
      comments: file.metadata.comments || 0
    }));

    res.json(papers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
