require("dotenv").config();
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
var AWS = require("aws-sdk");
const { promisify } = require("util");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

const s3 = new AWS.S3();

const upload = (params) => {
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        reject("Falha ao completar requisição");
      } else {
        resolve(data);
      }
    });
  });
};

const multerConfig = {
  dest: path.resolve(__dirname, "..", "tmps", "imgs"),
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(__dirname, "..", "tmps", "imgs"));
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

  const newName = `${fileName}-${Date.now()}`;
  const pathFile = path.resolve(__dirname, "..", "tmps", "imgs", newName);
  fs.writeFileSync(pathFile, base64, { encoding: "base64" });
  let newPath = `https://partyrs.s3-sa-east-1.amazonaws.com/${newName}`;

  try {
    const data = await sharp(pathFile)
      .resize(720)
      .toFormat("webp")
      .webp({ quality: 75 })
      .toBuffer();

    fs.access(pathFile, fs.constants.R_OK, (err) => {
      if (!err) {
        const file = path.resolve(__dirname, "..", pathFile);
        fs.unlink(file, (err) => {
          if (err) console.log(err);
        });
      }
    });

    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: `${newName}`,
      Body: data,
      ACL: "public-read",
      ContentEncoding: "webp", // required
      ContentType: `image/webp`,
    };

    const finalPath = await upload(params);
    return finalPath.Location;
  } catch (err) {
    deleteImage(path.resolve(__dirname, "..", "tmps", "imgs", newName));
  }
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
