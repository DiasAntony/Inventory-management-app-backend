const asyncHandler = require("express-async-handler");
const User = require("../models/user");
// const bcrypt=require('bcrypt')
const jwt = require("jsonwebtoken");

// generate jwt token
// id =>db user id
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "2d" });
};

// Register User

exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  // Check if user email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("Email has already been registered");
  }

  // Create new user
  const user = await User.create({
    // name:name ==> name from db and name from req.body
    name,
    email,
    password,
  });

  //   generate jwt token
  // db user id
  const token = generateToken(user._id);

  //   mostly we token save in localstorage in our frontend . now we send token only the http-only cookie

  // Send token in HTTP-only cookie
  res.cookie("token", token, {
    path: "/",
    httpsOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });

//   some times its does'nt show postmon res.cookie because we set secure=true

  if (user) {
    const { _id, name, email, phone, photo, bio } = user;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid User data");
  }
});
