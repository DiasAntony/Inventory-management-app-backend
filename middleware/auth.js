const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

// Authorization middleware => if the user have token(authorized) then only allow

const protect = asyncHandler(async (req, res, next) => {
  try {
    // we take the token from cookie
    // req.cookies.token ==> token is our setted name in cookie
    const token = req.cookies.token;
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }

    // Verify Token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // Get user id from token ==> we already create or generate the token with userid (encode) and now we get the userid from token(decode)
    // why use verified.id==> verified the decode form of token then it payload contain several property so that property have an id thats is our id.
    // if any doubtcheck screenshot from pc{jwt comparision}
    const user = await User.findById(verified.id).select("-password");

    // token below

    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0MjE2OGY2Njg2ZjNkOGIwZTg4NjMwMCIsImlhdCI6MTY3OTk4NzY4NywiZXhwIjoxNjgwMTYwNDg3fQ.3q2xQ0gXsF5jpeeW-Drd2U63zxpeo4SE7Ngx7PR62fo

    // decoded payload

    // {
    //     "id": "642168f6686f3d8b0e886300", its equal to user._id(db user ID)
    //     "iat": 1679987687,
    //     "exp": 1680160487
    //   }
 

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }


    // this req.user =user => req.user fro this middleware response like middleware send the req to the next function(route function) like getUser(get the exact user from token)
    // user is from above (DB user) and we can get the other data like name ,email,photo,phone,bio like {user._id   ,  user.email}
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }
});

module.exports = protect;
