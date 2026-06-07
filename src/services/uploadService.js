const fs = require('fs');
const path = require('path');

const uploadDir = process.env.UPLOAD_DIR || './uploads';

const deleteFile = (filename) => {
  try {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const deleteMultipleFiles = (filenames) => {
  filenames.forEach(filename => deleteFile(filename));
  return { success: true };
};

const getUploadedFileUrl = (filename) => {
  return `/uploads/${filename}`;
};

module.exports = { deleteFile, deleteMultipleFiles, getUploadedFileUrl };
