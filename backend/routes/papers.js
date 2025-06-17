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
    }

    const { userId, title, description } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Create upload stream
    const uploadStream = gfs.openUploadStream(req.file.originalname, {
      metadata: {
        userId: userId,
        title: title || req.file.originalname,
        description: description || '',
        uploadDate: new Date(),
        contentType: req.file.mimetype,
        size: req.file.size
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
      uploadDate: file.metadata.uploadDate,
      size: file.metadata.size,
      contentType: file.metadata.contentType
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

// Get all papers (for admin)
router.get('/admin/all', async (req, res) => {
  try {
    const files = await gfs.find({}).toArray();
    
    const papers = files.map(file => ({
      id: file._id,
      filename: file.filename,
      title: file.metadata.title,
      description: file.metadata.description,
      userId: file.metadata.userId,
      uploadDate: file.metadata.uploadDate,
      size: file.metadata.size,
      contentType: file.metadata.contentType
    }));

    res.json(papers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
