const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
    secure: process.env.NODE_ENV === "development" ? false : true,
    // secure: true
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
      // secure: process.env.NODE_ENV !== "development",
      secure: process.env.NODE_ENV === "development" ? false : true,
      // secure: true,
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
    // secure: process.env.NODE_ENV !== "development",
    secure: process.env.NODE_ENV === "development" ? false : true,
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

// getUser profile or data

exports.getUser = asyncHandler(async (req, res) => {
  // inthis case req.user._id ==> req.user from request of middleware and thats's a exact user(db) so
  const user = await User.findById(req.user._id);

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
    });
  } else {
    res.status(400);
    throw new Error("User Not Found");
  }
});

// get user status (like if user loggedIn or not )

exports.loginStatus=asyncHandler(async(req,res)=>{
// you already learn from protect middleware below 
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
})

// Update User
exports.updateUser = asyncHandler(async (req, res) => {
  // req.user._id from middleware request
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, email, photo, phone, bio } = user;
    user.email = email;
    // user sometimes upadte only one or 2,3 or non so that
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;
    user.photo = req.body.photo || photo;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});