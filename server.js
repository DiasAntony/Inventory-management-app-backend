const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const userRoute = require("./routes/user");
const errorHandler = require("./middleware/error");
const productRoute = require("./routes/product");
const contactRoute = require("./routes/contact");

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
// upload files stored in uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes (route=>middleware)
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/contact", contactRoute);

// error middleware
app.use(errorHandler);

//DB and Server Connection

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`DB and Server Running on port ${5000}`);
    });
  })
  .catch((err) => console.log(err));
