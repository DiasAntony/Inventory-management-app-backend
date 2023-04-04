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
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://inventory-management-app-react.vercel.app",
    ],
    credentials: true,
  })
);
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
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    autoIndex: false, // Don't build indexes
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`DB and Server Running on port ${5000}`);
    });
  })
  .catch((err) => console.log(err));
