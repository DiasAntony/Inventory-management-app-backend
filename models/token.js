const mongoose = require("mongoose");

// const { ObjectId } = mongoose.Schema;


const tokenSchema=mongoose.Schema({
    // Db colob [relationship]
    userId: {
        // objectId from user unique user id [in DB]
        // 
        type: mongoose.Schema.Types.ObjectId,
        // type:ObjectId,
        ref: "user",
        required: true
      },
      token: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        required: true,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
})

module.exports=mongoose.model("Token",tokenSchema)

// in db how its stored

// _id:ObjectId("6423ed3f16250e43b881a85a"),
// userId:ObjectId("6423e0bd2c8d78da39fcdb3c"),
// token:"00b0e8c107cc577599a26050952cf8a3782bb08360042311817ed69ec828dc5b",
// createdAt:{"$date":{"$numberLong":"1680076095923"}},
// expiresAt:{"$date":{"$numberLong":"1680077895923"}},
// __v:{"$numberInt":"0"}}