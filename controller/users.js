const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const config = require('../config');

const { dbUrl } = config;

module.exports = {
  getUsers: async (req, resp, next) => {
    try {
      const client = new MongoClient(dbUrl);
      await client.connect();
      const db = client.db();
      const collection = db.collection('users');
      const usuarios = await collection.find({}).toArray();
      resp.send(usuarios);
    } catch (error) {
      /* h */
    }
    // TODO: Implementa la función necesaria para traer la colección `users`
    next();
  },
  postUser: async (req, resp, next) => {
    const credentials = {
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      rol: req.body.rol,
    };

    try {
      const client = new MongoClient(dbUrl);
      await client.connect();
      const db = client.db();
      const collection = db.collection('users');
      const user = await collection.findOne({ email: req.body.email });
      if (!user) {
        await collection.insertOne(credentials);
        resp.status(200).send('se agrego nuevo usuario');
      } else {
        resp.send('ya existe el usuario');
      }
    } catch (error) {
      /*  */
    }
    next();
  },
  getUser: async (req, resp, next) => {
    const userIdOrEmail = req.params.uid;
    try {
      const client = new MongoClient(dbUrl);
      await client.connect();
      const db = client.db();
      const collection = db.collection('users');

      const user = await collection.findOne({
        $or: [{ email: userIdOrEmail }, { _id: new ObjectId(userIdOrEmail) }],
      });
      if (!user) {
        console.log('wuat');
        resp.status(404).send('there is no user with that uid');
      } else {
        resp.send(user);
      }
      client.close();
    } catch (error) {
      console.log(error);
    }
    next();
  },
};
