const path = require("path");
const express = require("express");
const app = express(); // create express app

let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}

// add middlewares
app.use(express.static(path.join(__dirname, "..", "build")));
app.use(express.static("public"));

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});

// start express server
app.listen(port, () => {
  console.log("server started");
});
