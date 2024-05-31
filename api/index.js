require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user');
const bodyParser = require('body-parser');
const path = require('path');
const { Blob } = require('@vercel/blob');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

app.post('/users', async (req, res) => {
  try {
    const { name, email, photoBase64 } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Email already exists');
    }

    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob();

    const response = await blob.upload(buffer, {
      filename: `${Date.now()}-${name}.png`,
      contentType: 'image/png',
      access: 'public',
    });
    const photoUrl = response.url;

    const newUser = new User({
      name,
      email,
      photoUrl,
    });

    await newUser.save();

    await newUser.save();

    res.status(201).send('User created successfully');
  } catch (error) {
    console.error('Error while creating user:', error);
    res.status(500).send('Error creating user');
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (error) {
    console.error('Error while fetching users:', error);
    res.status(500).send('Error fetching users');
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.status(200).send(user);
  } catch (error) {
    console.error('Error while fetching user:', error);
    res.status(500).send('Error fetching user');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
