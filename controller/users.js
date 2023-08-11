/* eslint-disable max-len */
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

      const { page } = req.query;
      const { limit } = req.query;
      let startIndex;
      let endIndex;
      let linkHeader;
      if (page) {
        startIndex = (page - 1) * limit;
        endIndex = page * limit;
      } else {
        startIndex = 0;
        endIndex = 1 * limit;
      }

      if (page && limit) {
        linkHeader = [
          `<http://localhost:8080/users?page=1&limit=${limit}>; rel="first",<http://localhost:8080/users?page=${(page === 1 ? 1 : page - 1)}&limit=${limit}>; rel="prev", <http://localhost:8080/users?page=${page + 1}&limit=${limit}>; rel="next",<http://localhost:8080/users?page=2&limit=1>; rel="last"`];
        const resultUsers = usuarios.slice(startIndex, endIndex);
        resp.setHeader('Link', linkHeader);
        resp.send(resultUsers);
      } else if (!page && limit) {
        linkHeader = [
          `<http://localhost:8080/users?page=1&limit=${limit}>; rel="first",<http://localhost:8080/users?page=1&limit=${limit}>; rel="prev", <http://localhost:8080/users?page=2&limit=${limit}>; rel="next",<http://localhost:8080/users?page=2&limit=1>; rel="last"`];
        const resultUsers = usuarios.slice(startIndex, endIndex);
        resp.setHeader('Link', linkHeader);
        resp.send(resultUsers);
      } else {
        resp.send(usuarios);
      }
      // Establecer el encabezado Link en la respuesta
    } catch (error) {
      /* h */
    }
    // TODO: Implementa la función necesaria para traer la colección `users`
    next();
  },
  postUser: async (req, resp, next) => {
    const credentials = {
      email: req.body.email,
      password: req.body.password ? bcrypt.hashSync(req.body.password, 10) : null,
      rol: req.body.rol,
    };

    try {
      const client = new MongoClient(dbUrl);
      await client.connect();
      const db = client.db();
      const collection = db.collection('users');
      const user = await collection.findOne({ email: req.body.email });
      if (!credentials.email || !credentials.password || !credentials.email.includes('@') || req.body.password.length < 5) {
        next(400);
      }
      if (!user) {
        await collection.insertOne(credentials);
        // eslint-disable-next-line max-len
        const newuser = await collection.findOne({ email: req.body.email }, { projection: { password: 0 } });
        resp.send(newuser);
      } else {
        next(403);
      }
    } catch (error) {
      console.log(error);
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

      // const user = await collection.findOne({
      //   $or: [{ email: userIdOrEmail }, { _id: new ObjectId(userIdOrEmail) }],
      // });
      const useremail = await collection.findOne({ email: userIdOrEmail });
      if (!useremail) {
        const user = await collection.findOne({ _id: new ObjectId(userIdOrEmail) });
        if (!user) {
          resp.status(404).send('there is no user with that uid');
        } else {
          resp.send(user);
        }
      } else if (useremail.email !== req.email && req.rol !== 'admin') {
        console.log(useremail.email, req.email);
        next(403);
      } else {
        resp.send(useremail);
      }
      client.close();
    } catch (error) {
      console.log(error);
    }
    next();
  },
  patchUser: async (req, resp, next) => {
    const userEmail = req.params.uid;
    if (req.rol !== 'admin') {
      next(403);
    }
    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 10);
    }

    const newCredentials = req.body;

    try {
      const client = new MongoClient(dbUrl);
      await client.connect();
      const db = client.db();
      const collection = db.collection('users');

      // eslint-disable-next-line max-len
      const user = await collection.findOne({ email: (userEmail) });
      if (!user) {
        client.close();
        next(404);
      } else {
        if (Object.keys(req.body).length === 0) {
          client.close();
          next(400);
        }
        // eslint-disable-next-line max-len
        await collection.updateOne({ email: (userEmail) }, { $set: newCredentials });
        const user1 = await collection.findOne({ email: (userEmail) }, { projection: { password: 0 } });
        client.close();
        resp.send(user1);
      }
    } catch (error) {
      console.log('ERRRRRRROR:', error);
    }
    next();
  },
  deleteUser: async (req, resp, next) => {
    const userEmail = req.params.uid;
    console.log('EMAIL:', userEmail);
    console.log('EMAIL:', req.email);
    if (userEmail.email !== req.email && req.rol !== 'admin') {
      console.log('ENTRO:', req.email, 'OTRO EMAIL:', userEmail);
      next(403);
    }

    try {
      const client = new MongoClient(dbUrl);
      await client.connect();
      const db = client.db();
      const collection = db.collection('users');

      // eslint-disable-next-line max-len
      const user = await collection.findOne({ email: (userEmail) });
      if (!user) {
        next(404);
      } else {
        await collection.deleteOne(user);
        console.log('se elimino:', req.auth, req.rol, req.email);
        resp.status(200).send('se eliminó');
      }
    } catch (error) {
      console.log(error);
    }
    next();
  },
};
