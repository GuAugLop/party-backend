const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const multerConfig = {
  dest: path.resolve(__dirname, "..", "tmp", "imgs"),
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(__dirname, "..", "tmp", "imgs"));
    },
    filename: (req, file, cb) => {
      const fileName = Date.now().toString() + "-" + file.originalname;
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpg",
      "image/jpeg",
      "image/pjpeg",
      "image/png",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid Format"));
    }
  },
};

const compressImage = async (filePath, size = 720) => {
  const newPath = (filePath.split(".")[0] + ".webp").replaceAll(/[\\]/g, "/");
  return sharp(filePath)
    .resize(size)
    .toFormat("webp")
    .webp({ quality: 75 })
    .toBuffer()
    .then(async (data) => {
      fs.access(filePath, fs.constants.R_OK, (err) => {
        if (!err) {
          const pathFile = path.resolve(__dirname, "..", filePath);
          fs.unlink(pathFile, (err) => {
            if (err) console.log(err);
          });
        }
      });

      fs.writeFile(newPath, data, (err) => {
        if (err) {
          console.log(err);
        }
      });
    })
    .then(() => {
      return newPath;
    });
};

const deleteImage = (filePath) => {
  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (!err) {
      const pathFile = path.resolve(__dirname, "..", filePath);
      fs.unlink(pathFile, (err) => {
        if (err) console.log(err);
      });
    }
  });
};
module.exports = { multerConfig, compressImage, deleteImage };
