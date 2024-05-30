require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const User = require('../models/user');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }); */

const uri = process.env.MONGODB_URI;

mongoose.set('strictQuery', false);

async function connectToMongoDB() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    });
    console.log('Mongoose connected to ' + uri);
  } catch (err) {
    console.error('Mongoose connection error:', err);
    setTimeout(connectToMongoDB, 5000);
  }
}

connectToMongoDB();

app.post('/users', async (req, res) => {
  try {
    console.log('Received POST /users request with body:', req.body);
    const { name, email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Email already exists');
    }

    const newUser = new User({ name, email });
    console.log('Saving new user to the database...');
    await newUser.save();
    console.log('User saved successfully:', newUser);
    res.status(201).send(newUser);
  } catch (error) {
    console.error('Error while saving user:', error);
    res.status(400).send(error.message);
  }
});

app.get('/users', async (req, res) => {
  try {
    console.log('Received GET /users request');
    const users = await User.find();
    res.status(200).send(users);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send('Invalid user ID');
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.status(200).send(user);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

//fix
