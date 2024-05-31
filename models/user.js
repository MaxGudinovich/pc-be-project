const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: String,
    lastName: String,
    occupation: String,
    age: Number,
    city: String,
    email: String,
    description: String,
    photoUrl: String,
  },
  { versionKey: false }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
