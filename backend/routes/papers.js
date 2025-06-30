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
    }    const { userId, title, description, journal, year, authors, tags, doi, publisher, sdgs } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Parse JSON fields
    let parsedAuthors = [];
    let parsedTags = [];
    let parsedSDGs = [];
    
    try {
      if (authors) parsedAuthors = JSON.parse(authors);
      if (tags) parsedTags = JSON.parse(tags);
      if (sdgs) parsedSDGs = JSON.parse(sdgs);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid authors, tags, or sdgs format' });
    }    // Create upload stream
    const uploadStream = gfs.openUploadStream(req.file.originalname, {
      metadata: {
        userId: userId,
        title: title || req.file.originalname,
        description: description || '',
        journal: journal || '',
        year: year || new Date().getFullYear().toString(),
        publisher: publisher || '',
        authors: parsedAuthors,
        tags: parsedTags,
        sdgs: parsedSDGs,
        doi: doi || `DOI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        uploadDate: new Date(),
        contentType: req.file.mimetype,
        size: req.file.size,
        impact: 0,
        clarity: 0,
        likes: 0,
        dislikes: 0,
        comments: 0,
        userLikes: [],
        userDislikes: [],
        paperComments: []
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

// Get user's papers (including papers where user is a co-author)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find papers where user is the main author
    const ownedFiles = await gfs.find({ 'metadata.userId': userId }).toArray();
    
    // Find papers where user is a co-author
    const coauthorFiles = await gfs.find({ 'metadata.authors.userId': userId }).toArray();
    
    // Combine and remove duplicates
    const allPaperFiles = [...ownedFiles];
    
    // Add co-authored papers if they aren't already included
    coauthorFiles.forEach(file => {
      if (!allPaperFiles.some(existingFile => existingFile._id.toString() === file._id.toString())) {
        allPaperFiles.push(file);
      }
    });
    
    const papers = allPaperFiles.map(file => ({
      id: file._id,
      filename: file.filename,
      title: file.metadata.title,
      description: file.metadata.description,
      abstract: file.metadata.description, // For backward compatibility
      journal: file.metadata.journal,
      year: file.metadata.year,
      publisher: file.metadata.publisher || '',
      authors: file.metadata.authors || [],
      tags: file.metadata.tags || [],
      sdgs: file.metadata.sdgs || [],
      doi: file.metadata.doi,
      uploadDate: file.metadata.uploadDate,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      impact: file.metadata.impact || 0,
      clarity: file.metadata.clarity || 0,
      likes: file.metadata.likes || 0,
      dislikes: file.metadata.dislikes || 0,
      comments: file.metadata.comments || 0,
      isOwner: file.metadata.userId === userId // Flag to indicate if user is the owner
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

    // Check if user owns the file or is a co-author
    if (userId && file.metadata.userId !== userId) {
      // Check if user is a co-author
      const isCoAuthor = file.metadata.authors && 
                        file.metadata.authors.some(author => 
                          author.userId === userId
                        );
      
      if (!isCoAuthor) {
        return res.status(403).json({ message: 'Access denied' });
      }
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

// Update paper metadata
router.put('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId, title, description, journal, year, publisher, authors, tags, sdgs, doi } = req.body;

    // Find the file first to check ownership
    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = files[0];

    // Check if user owns the file or is a co-author
    const isOwner = file.metadata.userId === userId;
    const isCoAuthor = file.metadata.authors && 
                      file.metadata.authors.some(author => 
                        author.userId === userId
                      );
    
    if (!isOwner && !isCoAuthor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update metadata in MongoDB directly
    await mongoose.connection.db.collection('papers.files').updateOne(
      { _id: new mongoose.Types.ObjectId(fileId) },
      { 
        $set: { 
          'metadata.title': title || file.metadata.title,
          'metadata.description': description || file.metadata.description,
          'metadata.journal': journal || file.metadata.journal,
          'metadata.year': year || file.metadata.year,
          'metadata.publisher': publisher || file.metadata.publisher,
          'metadata.authors': authors || file.metadata.authors,
          'metadata.tags': tags || file.metadata.tags,
          'metadata.sdgs': sdgs || file.metadata.sdgs,
          'metadata.doi': doi || file.metadata.doi
        } 
      }
    );
    
    res.json({ 
      message: 'File updated successfully',
      fileId: fileId
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all papers for public display (homepage)
router.get('/public', async (req, res) => {
  try {
    const files = await gfs.find({}).toArray();      const papers = files.map(file => ({
      id: file._id,
      title: file.metadata.title,
      journal: file.metadata.journal || 'Unknown Journal',
      year: file.metadata.year || new Date().getFullYear().toString(),
      publisher: file.metadata.publisher || '',
      doi: file.metadata.doi || 'DOI link',
      authors: file.metadata.authors || [],
      abstract: file.metadata.description || 'No abstract available.',
      tags: file.metadata.tags || [],
      sdgs: file.metadata.sdgs || [],
      impact: file.metadata.impact || (Math.random() * 2 + 3).toFixed(1), // Random rating 3-5
      clarity: file.metadata.clarity || (Math.random() * 2 + 3).toFixed(1), // Random rating 3-5
      likes: file.metadata.likes || 0,
      dislikes: file.metadata.dislikes || 0,
      comments: (file.metadata.paperComments || []).length,
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
    const files = await gfs.find({}).toArray();      const papers = files.map(file => ({
      id: file._id,
      filename: file.filename,
      title: file.metadata.title,
      description: file.metadata.description,
      journal: file.metadata.journal,
      year: file.metadata.year,
      publisher: file.metadata.publisher || '',
      authors: file.metadata.authors || [],
      tags: file.metadata.tags || [],
      sdgs: file.metadata.sdgs || [],
      doi: file.metadata.doi,
      userId: file.metadata.userId,
      uploadDate: file.metadata.uploadDate,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      impact: file.metadata.impact || 0,
      clarity: file.metadata.clarity || 0,
      likes: file.metadata.likes || 0,
      dislikes: file.metadata.dislikes || 0,
      comments: file.metadata.comments || 0
    }));

    res.json(papers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single paper details
router.get('/:paperId', async (req, res) => {
  try {
    const { paperId } = req.params;
    
    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(paperId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    const file = files[0];    const paper = {
      id: file._id,
      filename: file.filename,
      title: file.metadata.title,
      description: file.metadata.description,
      journal: file.metadata.journal,
      year: file.metadata.year,
      publisher: file.metadata.publisher || '',
      authors: file.metadata.authors || [],
      tags: file.metadata.tags || [],
      sdgs: file.metadata.sdgs || [],
      doi: file.metadata.doi,
      userId: file.metadata.userId,
      uploadDate: file.metadata.uploadDate,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      impact: file.metadata.impact || 0,
      clarity: file.metadata.clarity || 0,
      likes: file.metadata.likes || 0,
      dislikes: file.metadata.dislikes || 0,
      userLikes: file.metadata.userLikes || [],
      userDislikes: file.metadata.userDislikes || [],
      comments: file.metadata.paperComments || []
    };

    res.json(paper);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like a paper
router.post('/:paperId/like', async (req, res) => {
  try {
    const { paperId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(paperId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    const file = files[0];
    const userLikes = file.metadata.userLikes || [];
    const userDislikes = file.metadata.userDislikes || [];
    
    // Check if user already liked
    if (userLikes.includes(userId)) {
      return res.status(400).json({ message: 'You have already liked this paper' });
    }    // Remove from dislikes if exists
    const updatedDislikes = userDislikes.filter(id => id !== userId);
    const updatedLikes = [...userLikes, userId];

    // Update the file metadata directly in the database
    await mongoose.connection.db.collection('papers.files').updateOne(
      { _id: new mongoose.Types.ObjectId(paperId) },
      { 
        $set: { 
          'metadata.userLikes': updatedLikes,
          'metadata.userDislikes': updatedDislikes,
          'metadata.likes': updatedLikes.length,
          'metadata.dislikes': updatedDislikes.length
        }
      }
    );

    res.json({ 
      message: 'Paper liked successfully',
      likes: updatedLikes.length,
      dislikes: updatedDislikes.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Dislike a paper
router.post('/:paperId/dislike', async (req, res) => {
  try {
    const { paperId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(paperId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    const file = files[0];
    const userLikes = file.metadata.userLikes || [];
    const userDislikes = file.metadata.userDislikes || [];
    
    // Check if user already disliked
    if (userDislikes.includes(userId)) {
      return res.status(400).json({ message: 'You have already disliked this paper' });
    }    // Remove from likes if exists
    const updatedLikes = userLikes.filter(id => id !== userId);
    const updatedDislikes = [...userDislikes, userId];

    // Update the file metadata directly in the database
    await mongoose.connection.db.collection('papers.files').updateOne(
      { _id: new mongoose.Types.ObjectId(paperId) },
      { 
        $set: { 
          'metadata.userLikes': updatedLikes,
          'metadata.userDislikes': updatedDislikes,
          'metadata.likes': updatedLikes.length,
          'metadata.dislikes': updatedDislikes.length
        }
      }
    );

    res.json({ 
      message: 'Paper disliked successfully',
      likes: updatedLikes.length,
      dislikes: updatedDislikes.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a comment to a paper
router.post('/:paperId/comment', async (req, res) => {
  try {
    const { paperId } = req.params;
    const { userId, userEmail, content, parentCommentId } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ message: 'User ID and content are required' });
    }

    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(paperId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    const file = files[0];
    const existingComments = file.metadata.paperComments || [];
    
    const newComment = {
      id: new mongoose.Types.ObjectId().toString(),
      userId,
      userEmail,
      content,
      timestamp: new Date(),
      parentCommentId: parentCommentId || null
    };    const updatedComments = [...existingComments, newComment];

    // Update the file metadata directly in the database
    await mongoose.connection.db.collection('papers.files').updateOne(
      { _id: new mongoose.Types.ObjectId(paperId) },
      { 
        $set: { 
          'metadata.paperComments': updatedComments,
          'metadata.comments': updatedComments.length
        }
      }
    );

    res.json({ 
      message: 'Comment added successfully',
      comment: newComment,
      totalComments: updatedComments.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check download permission
router.get('/:paperId/download-permission', async (req, res) => {
  try {
    const { paperId } = req.params;
    const { userId } = req.query;

    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(paperId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    const file = files[0];
    
    // Check permissions
    let canDownload = false;
    let reason = '';

    if (!userId) {
      reason = 'Please sign in to download papers';
    } else {
      // Get user details to check role
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user) {
        reason = 'User not found';
      } else if (user.role === 'admin') {
        canDownload = true;
        reason = 'Admin access';
      } else if (file.metadata.userId === userId) {
        canDownload = true;
        reason = 'Paper owner access';
      } else {
        reason = 'You need to request access from the administrator to download this paper';
      }
    }

    res.json({ 
      canDownload,
      reason,
      paperTitle: file.metadata.title
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin paper management routes

// Delete paper (admin only)
router.delete('/admin/papers/:paperId', async (req, res) => {
  try {
    const { paperId } = req.params;

    // Find the file first to check if it exists
    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(paperId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // Delete the file from GridFS
    await gfs.delete(new mongoose.Types.ObjectId(paperId));

    res.json({ message: 'Paper deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update paper status/metadata (admin only)
router.put('/admin/papers/:paperId', async (req, res) => {
  try {
    const { paperId } = req.params;
    const { title, description, journal, year, publisher, authors, tags, sdgs, doi } = req.body;

    // Find the file
    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(paperId) }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    const file = files[0];

    // Update metadata
    const updatedMetadata = {
      ...file.metadata,
      title: title || file.metadata.title,
      description: description || file.metadata.description,
      journal: journal || file.metadata.journal,
      year: year || file.metadata.year,
      publisher: publisher || file.metadata.publisher,
      authors: authors || file.metadata.authors,
      tags: tags || file.metadata.tags,
      sdgs: sdgs || file.metadata.sdgs,
      doi: doi || file.metadata.doi,
      lastModified: new Date()
    };

    // Since GridFS doesn't support metadata updates directly, we need to use MongoDB operations
    await mongoose.connection.db.collection('papers.files').updateOne(
      { _id: new mongoose.Types.ObjectId(paperId) },
      { $set: { metadata: updatedMetadata } }
    );

    res.json({ message: 'Paper updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get paper statistics (admin only)
router.get('/admin/stats', async (req, res) => {
  try {
    const totalPapers = await gfs.find({}).toArray();
    const totalCount = totalPapers.length;
    
    // Calculate total file size
    const totalSize = totalPapers.reduce((sum, file) => sum + (file.metadata.size || 0), 0);
    
    // Get recent uploads
    const recentPapers = totalPapers
      .sort((a, b) => new Date(b.metadata.uploadDate) - new Date(a.metadata.uploadDate))
      .slice(0, 5)
      .map(file => ({
        id: file._id,
        title: file.metadata.title,
        uploadDate: file.metadata.uploadDate,
        userId: file.metadata.userId,
        size: file.metadata.size
      }));

    // Count by year
    const papersByYear = {};
    totalPapers.forEach(file => {
      const year = file.metadata.year || 'Unknown';
      papersByYear[year] = (papersByYear[year] || 0) + 1;
    });

    res.json({
      totalPapers: totalCount,
      totalSize,
      recentPapers,
      papersByYear
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users for co-author selection
router.get('/get-users-for-author-selection', async (req, res) => {
  try {
    // Find users with approved status
    const users = await mongoose.connection.db.collection('users').find(
      { status: 'approved' },
      { projection: { password: 0 } } // Exclude password
    ).toArray();
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
