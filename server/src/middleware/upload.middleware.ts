import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSizeMb * 1024 * 1024,
    files: config.upload.maxFiles, // Maximum 35 photos enforced
  },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'];
    const isImageMime =
      config.upload.allowedMimeTypes.includes(file.mimetype.toLowerCase()) ||
      file.mimetype === 'image/heic-sequence' ||
      file.mimetype === 'application/octet-stream';

    if (ext && allowedExts.includes(ext) && isImageMime) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.originalname}. Only JPG, PNG, HEIC, and WebP images are permitted.`));
    }
  },
});

export const handleMulterUpload = (req: Request, res: Response, next: NextFunction) => {
  const uploadArray = upload.array('photos', config.upload.maxFiles);

  uploadArray(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_COUNT') {
        res.status(400).json({
          success: false,
          error: `Maximum upload limit exceeded. You can upload up to ${config.upload.maxFiles} photos at once.`,
        });
        return;
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: `One or more files exceed the maximum size limit of ${config.upload.maxFileSizeMb}MB.`,
        });
        return;
      }
      res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
      return;
    } else if (err) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    next();
  });
};
