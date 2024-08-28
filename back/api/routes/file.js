const express = require('express');
const router = express.Router();
const { authenticated, hasPermission } = require('../middlewares');
const FileController = require('../controllers/FileController');

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post(
  `/upload`,
  [ authenticated, hasPermission('dev'), upload.single('file')],
  FileController.upload
);

module.exports = router;