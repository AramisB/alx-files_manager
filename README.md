FILE MANAGER
This project is a summary of this back-end trimester: authentication, NodeJS, MongoDB, Redis, pagination and background processing.

The objective is to build a simple platform to upload and view files:
User authentication via a token
List all files
Upload a new file
Change permission of a file
View a file
Generate thumbnails for images

Temporary Data in Redis
Use Redis to cache data that doesn't need to be persisted in the database permanently.
Example: Store a session in Redis
app.post('/session', (req, res) => {
  const { key, value } = req.body;
  redisClient.setex(key, 3600, value); //Store value with an expiration of 1 hour
  res.send('Session stored in Redis');
});

Retrieve a session
app.get('/session/:key', (req, res) => {
  redisClient.get(req.params.key, (err, data) => {
    if (err) return res.status(500).send('Error retrieving session');
    res.json({ data });
  });
});

Step 5: Setting Up a Background Worker
Use a job queue like Bull for background processing.
Install Bull:
npm install bull

Set Up Worker Queue (workers/emailWorker.js)
const Queue = require('bull');
const redisClient = redis.createClient();
const emailQueue = new Queue('email', { redis: { host: '127.0.0.1', port: 6379 } });

Process jobs
emailQueue.process(async (job) => {
  console.log('Processing job:', job.data);
  Simulate sending an email
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('Email sent:', job.data);
});

module.exports = emailQueue;

Adding Jobs to the Queue (routes/jobs.js)
const express = require('express');
const emailQueue = require('../workers/emailWorker');
const router = express.Router();

router.post('/send-email', (req, res) => {
  const { to, subject, body } = req.body;
  emailQueue.add({ to, subject, body }); Add job to queue
  res.json({ message: 'Email job added to queue' });
});

module.exports = router;

Include Job Routes in index.js
const jobRoutes = require('./routes/jobs');
app.use('/jobs', jobRoutes);

Step 6: File Operations with Multer
Setup File Uploads (routes/files.js)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

List all files
router.get('/files', (req, res) => {
  fs.readdir('uploads/', (err, files) => {
    if (err) return res.status(500).send('Error listing files');
    res.json(files);
  });
});

Upload a new file
router.post('/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.filename });
});

Change permission of a file
router.post('/permissions', (req, res) => {
  const { filename, mode } = req.body;
  fs.chmod(`uploads/${filename}`, mode, (err) => {
    if (err) return res.status(500).send('Failed to change permissions');
    res.send('Permissions changed');
  });
});

View a file
router.get('/view/:filename', (req, res) => {
  const { filename } = req.params;
  res.sendFile(`${__dirname}/uploads/${filename}`);
});

Generate thumbnails for images
router.post('/thumbnail', upload.single('image'), async (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `uploads/thumb-${req.file.filename}.png`;
  await sharp(inputPath).resize(100, 100).toFile(outputPath);
  res.json({ thumbnail: outputPath });
});

module.exports = router;
Include File Routes in index.js
const fileRoutes = require('./routes/files');
app.use('/files', fileRoutes);
