require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 8080;
require("./dbconfig/index");

const cors = require("cors");
app.use(cors());

app.use("/tmp/imgs", express.static("tmp/imgs"));

app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

//Controllers
app.use("/api/v1/", require("./controllers/auth"));

//require Token
app.use("/api/v1/", require("./controllers/user"));
app.use("/api/v1/", require("./controllers/post"));

app.listen(PORT, () => console.log("running in port: " + PORT));
