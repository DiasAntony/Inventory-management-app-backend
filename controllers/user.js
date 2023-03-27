const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const bcrypt = require("bcrypt");
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

// login user

exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // validate request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please Add email & password");
  }

  // check if user exist

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error(" User doesn't exist .Please register");
  }

  // check password

  // password from body user.password from db {user come from above code}
  const passwordIsCrt = await bcrypt.compare(password, user.password);

  if (!passwordIsCrt) {
    res.status(400);
    throw new Error(" Invalid password");
  }

  //   Generate Token
  const token = generateToken(user._id);

  if (passwordIsCrt) {
    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    });
  }

  if (user && passwordIsCrt) {
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
    throw new Error("Invalid email or password");
  }
});

// logout user
exports.logoutUser = asyncHandler(async (req, res) => {
  // in this time we not remove or delete cookie we just expire that
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});
