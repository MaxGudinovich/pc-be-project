require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const multer = require('multer');
const User = require('../models/user');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 60000,
});

mongoose.set('strictQuery', false);

async function connectToMongoDB() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 60000,
    });
    console.log('Mongoose connected to ' + uri);
  } catch (err) {
    console.error('Mongoose connection error:', err);
    setTimeout(connectToMongoDB, 5000);
  }
}

connectToMongoDB();

async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

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
        const db = client.db('test');
        const collection = db.collection('users');

        const users = await collection.find().toArray();
        res.status(200).send(users);
      } catch (error) {
        res.status(400).send(error.message);
      }
    });

    app.get('/users/:id', async (req, res) => {
      try {
        const db = client.db('test');
        const collection = db.collection('users');
        const userId = req.params.id;

        if (!ObjectId.isValid(userId)) {
          return res.status(400).send('Invalid user ID');
        }

        const user = await collection.findOne({ _id: new ObjectId(userId) });

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
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    setTimeout(run, 5000);
    setTimeout(connectToMongoDB, 5000);
  }
}

run().catch(console.error);

module.exports = app;

/* app.post('/users', upload.single('photo'), async (req, res) => {
    try {
      const { name, email } = req.body;
      let photo = '';

      // Проверяем, существует ли файл в запросе
      if (req.file) {
        photo = req.file.filename;
      }

      const newUser = new User({ name, email, photo });
      await newUser.save();

      res.status(201).send(newUser);
    } catch (error) {
      res.status(400).send(error.message);
    }
  }); */
