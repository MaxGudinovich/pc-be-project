const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    photo: { type: Buffer },
  },
  { versionKey: false }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
