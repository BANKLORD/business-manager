// controllers/FileController.js
/**
 * Multer stores the uploaded files in memory or on disk, and makes it easy to process and access the files in your Node.js application.
 * It can also be configured to handle different types of form data, such as text fields and checkboxes.
**/
const SpacesClient = require('do-spaces');
// Create a new Spaces client


const AWS = require('aws-sdk');
const fs = require('fs');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const doClient = new AWS.S3({
  endpoint: new AWS.Endpoint('https://fra1.digitaloceanspaces.com'),
  s3ForcePathStyle: true,
  region: process.env.DO_SPACE_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACE_KEY,
    secretAccessKey: process.env.DO_SPACE_SECRET,
  },
});

class FileController {
  static uploadToS3 = async (file) => {
    const fileStream = fs.createReadStream(file.path);
  
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: fileStream,
      Key: file.filename,
      ACL: 'public-read'
    };
  
    const result = await s3.upload(uploadParams).promise();
    return result.Location;
  };

  static uploadToDO = async (file) => {
    const fileStream = fs.createReadStream(file.path);
    const uploadParams = {
      Bucket: process.env.DO_SPACE_NAME,
      Body: fileStream,
      Key: file.filename,
      ACL: 'public-read'
    };

    const result = await doClient.upload(uploadParams).promise();
    return result.Location;
  }

  static upload = async (req, res) => {
    // Example API route that uploads a file to S3 and returns the file URL
    try {
      const fileUrl = await this.uploadToDO(req.file);
      res.send({ success: true, url: fileUrl });
    } catch (err) {
      console.log(err);
      res.status(500).send({ success: false, message: 'Failed to upload file' });
    }
  }
}

module.exports = FileController;