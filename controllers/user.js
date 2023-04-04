const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Token = require("../models/token");
const crypto = require("crypto");
const sendMail = require("../utils/sendMail");

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
    // sameSite: "none",
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
      // sameSite: "none",
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
    // sameSite: "none",
    // secure: process.env.NODE_ENV !== "development",
    secure: process.env.NODE_ENV === "development" ? false : true,
    // secure: true,
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

exports.loginStatus = asyncHandler(async (req, res) => {
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
});

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

// change password

// dont forgot when you develop front end ==> newpassword => not password

exports.changePassword = asyncHandler(async (req, res) => {
  // req.user._id come from middleware
  const user = await User.findById(req.user._id);
  const { oldPassword, newpassword } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  //Validate
  if (!oldPassword || !newpassword) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  // check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new password
  if (user && passwordIsCorrect) {
    // password save to db
    user.password = newpassword;
    await user.save();
    res.status(200).send("Password change successful");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});

// forgot password

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }
  // Delete token if it already exists in DB
  // userId is a token model in DB and the user._id is a user model in DB {token model have the user information from user db we colabrate it }
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    // why we delete coz somebody forgot thier password often so thats why!! if already exist multiple token stored in db (storage overflow)
    await token.deleteOne();
  }

  // Create Reset Token{its generate the long string encoded with user id}
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken);

  // Hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save Token to DB {we are save token model in db}
  await new Token({
    // [key:value] already know
    // uesrId from token model key , user._id from user db value (exact user who entered user db email)
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
  }).save();

  // Construct Reset Url {this link we send in the mail} without hashed token ...but in db is hashed token encoded
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Reset Email message we send too url (above link)
  const message = `
       <h2>Hello ${user.name}</h2>
       <p>Please use the url below to reset your password</p>  
       <p>This reset link is valid for only 30minutes.</p>
       <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
       <p>Regards...</p>
       <p>Inventory Team</p>
     `;
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendMail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// reset Password

exports.resetPassword=asyncHandler(async(req,res)=>{

  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash token, then compare to Token in DB {params is not hashed token..}so we need to validation
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // fIND tOKEN in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }

  // Find user
  // _id from user model(collection) db and userToken.userId from token model DB
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset Successful, Please Login",
  });
})