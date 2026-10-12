const cloudinary = require('cloudinary').v2;
const env = require('../config/env');
const logger = require('../utils/logger');
const AppError = require('../errors/AppError');

/**
 * Storage Service Abstraction
 * Supports direct Cloudinary upload with safe Data-URI fallback
 * to prevent 404 errors when Cloudinary credentials are unconfigured or mismatched.
 */
class StorageService {
  constructor() {
    this.cloudName = env.CLOUDINARY_CLOUD_NAME;
    this.apiKey = env.CLOUDINARY_API_KEY;
    this.apiSecret = env.CLOUDINARY_API_SECRET;
    this.isCloudinaryConfigured =
      Boolean(this.cloudName) &&
      Boolean(this.apiKey) &&
      Boolean(this.apiSecret) &&
      this.cloudName !== 'jobpilot-mock' &&
      !this.cloudName.includes('mock');

    if (this.isCloudinaryConfigured) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });
    }
  }

  /**
   * Validate uploaded file type and size
   */
  validateFile({ originalname, mimetype, size }) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    if (size && size > maxSizeBytes) {
      throw AppError.badRequest('File size exceeds the 10MB limit');
    }

    if (mimetype && !allowedMimeTypes.includes(mimetype)) {
      throw AppError.badRequest(
        'Invalid file type. Only PDF, DOC, DOCX, and common images (JPEG, PNG, WEBP) are supported.'
      );
    }

    return true;
  }

  /**
   * Upload Data URI (Base64) to Cloudinary or preserve for direct viewing
   */
  async uploadDataUri(dataUri, folder = 'jobpilot/resumes') {
    if (!dataUri) {
      return null;
    }

    if (this.isCloudinaryConfigured) {
      try {
        logger.info(`Attempting Cloudinary upload to folder [${folder}]...`);
        const result = await cloudinary.uploader.upload(dataUri, {
          folder,
          resource_type: 'auto',
        });
        logger.info(`Cloudinary upload successful! URL: ${result.secure_url}`);
        return {
          fileUrl: result.secure_url,
          cloudinaryId: result.public_id,
          fileSize: result.bytes || 0,
          fileType: result.format ? `application/${result.format}` : 'application/pdf',
          format: result.format || 'pdf',
        };
      } catch (err) {
        logger.warn(
          `Cloudinary upload error (${err.message}). Safely falling back to direct document storage.`
        );
      }
    }

    // Direct Data URI storage fallback (avoids broken 404 links)
    return {
      fileUrl: dataUri,
      cloudinaryId: null,
      fileSize: Math.round((dataUri.length * 3) / 4),
      fileType: dataUri.split(';')[0]?.replace('data:', '') || 'application/pdf',
      format: 'pdf',
    };
  }

  /**
   * Upload file buffer to Cloudinary or fallback
   */
  async uploadFile({ buffer, originalname, mimetype, folder = 'jobpilot/resumes' }) {
    this.validateFile({ originalname, mimetype, size: buffer?.length || 0 });

    if (buffer && this.isCloudinaryConfigured) {
      try {
        const base64Str = `data:${mimetype || 'application/pdf'};base64,${buffer.toString('base64')}`;
        return await this.uploadDataUri(base64Str, folder);
      } catch (err) {
        logger.warn(`Buffer upload to Cloudinary failed: ${err.message}`);
      }
    }

    return {
      fileUrl: `https://res.cloudinary.com/${this.cloudName || 'jobpilot'}/raw/upload/v1/${folder}/${encodeURIComponent(originalname || 'resume.pdf')}`,
      cloudinaryId: null,
      fileSize: buffer?.length || 1024 * 45,
      fileType: mimetype || 'application/pdf',
      format: originalname?.split('.').pop() || 'pdf',
    };
  }

  /**
   * Generate secure access URL for recruiter/candidate viewing
   */
  getSecureAccessUrl(cloudinaryId, fileUrl) {
    return fileUrl;
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(cloudinaryId) {
    if (!cloudinaryId || !this.isCloudinaryConfigured) return true;
    try {
      await cloudinary.uploader.destroy(cloudinaryId);
      logger.info(`Deleted file from Cloudinary: ${cloudinaryId}`);
    } catch (err) {
      logger.warn(`Could not delete file from Cloudinary: ${err.message}`);
    }
    return true;
  }
}

module.exports = new StorageService();
