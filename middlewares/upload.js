const multer = require('multer');
const path = require('path');

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/videos/'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter (only videos)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.mp4' || ext === '.mov' || ext === '.avi') {
    cb(null, true);
  } else {
    cb(new Error('Only video files allowed (.mp4, .mov, .avi)'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
