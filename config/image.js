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

const compressImage = async (req, res) => {
  const { base64, name } = req.body;
  const [fileName, format] = name.split(".");

  const newName = `${fileName}-${Date.now()}.${format}`;
  const pathFile = path.resolve(__dirname, "..", "tmp", "imgs", newName);
  fs.writeFileSync(pathFile, base64, { encoding: "base64" });

  const newPath = (pathFile.split(".")[0] + ".webp").replaceAll(/[\\]/g, "/");
  return sharp(pathFile)
    .resize(720)
    .toFormat("webp")
    .webp({ quality: 75 })
    .toBuffer()
    .then(async (data) => {
      fs.access(pathFile, fs.constants.R_OK, (err) => {
        if (!err) {
          const file = path.resolve(__dirname, "..", pathFile);
          fs.unlink(file, (err) => {
            if (err) console.log(err);
          });
        }
      });

      return fs.writeFile(newPath, data, (err) => {
        if (err) {
          console.log(err);
        }
      });
    })
    .then(() => {
      return newPath;
    })
    .catch((err) => {
      deleteImage(path.resolve(__dirname, "..", "tmp", "imgs", newName));
    });
};

const deleteImage = (filePath) => {
  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (!err) {
      const pathFile = path.resolve(__dirname, "..", filePath);
      fs.unlink(pathFile, (err) => {
        if (err) console.log("erro");
      });
    }
  });
};
module.exports = { multerConfig, compressImage, deleteImage };
