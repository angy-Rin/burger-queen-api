/* eslint-disable max-len */
const bcrypt = require('bcrypt');
const { calculateTotalPages } = require('./utils');
const { connect } = require('../connect');

module.exports = {
  getUsers: async (req, resp, next) => {
    try {
      const collection = await connect('users');
      const users = await collection.find({}).toArray();

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10);
      const startIndex = (page - 1 || 0) * limit;
      const endIndex = (page || 1) * limit;
      const totalPages = calculateTotalPages(users.length, limit);
      const resultUsers = users.slice(startIndex, endIndex);

      if (limit) {
        const baseUrl = 'http://localhost:8080/users';
        const linkHeader = [`<${baseUrl}?page=1&limit=${limit}>; rel="first"`,
          `<${baseUrl}?page=${page === 1 ? 1 : page - 1}&limit=${limit}>; rel="prev"`,
          `<${baseUrl}?page=${page + 1}&limit=${limit}>; rel="next"`,
          `<${baseUrl}?page=${totalPages}&limit=${limit}>; rel="last"`];

        resp.setHeader('Link', linkHeader.join(', '));
        return resp.send(resultUsers);
      }
      return resp.send(users);
    } catch (error) {
      console.log(error);
    }
    next();
  },
  postUser: async (req, resp, next) => {
    const credentials = {
      email: req.body.email,
      password: req.body.password ? bcrypt.hashSync(req.body.password, 10) : null,
      rol: req.body.rol,
    };

    try {
      const collection = await connect('users');
      const user = await collection.findOne({ email: req.body.email });
      if (!credentials.email || !credentials.password || !credentials.email.includes('@') || req.body.password.length < 5) {
        return next(400);
      }
      if (!user) {
        await collection.insertOne(credentials);
        // eslint-disable-next-line max-len
        const newuser = await collection.findOne({ email: req.body.email }, { projection: { password: 0 } });
        return resp.send(newuser);
      }
      return next(403);
    } catch (error) {
      console.log(error);
    }
    return next();
  },
  getUser: async (req, resp, next) => {
    const userIdOrEmail = req.params.uid;
    try {
      const collection = await connect('users');
      const useremail = await collection.findOne({ email: userIdOrEmail });
      if (!useremail) {
        const user = await collection.findOne({ _id: userIdOrEmail });
        if (!user) {
          return resp.status(404).send('there is no user with that uid');
        }
        return resp.status(200).send(user);
      } if (useremail.email !== req.email && req.rol !== 'admin') {
        return next(403);
      }
      return resp.send(useremail);
    } catch (error) {
      console.log(error);
    }
    next();
  },
  patchUser: async (req, resp, next) => {
    const userEmail = req.params.uid;
    if (req.rol !== 'admin') {
      return next(403);
    }
    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 10);
    }

    const newCredentials = req.body;

    try {
      const collection = await connect('users');
      const user = await collection.findOne({ email: (userEmail) });
      if (!user) {
        return next(404);
      }
      if (Object.keys(req.body).length === 0) {
        return next(400);
      }
      await collection.updateOne({ email: (userEmail) }, { $set: newCredentials });
      const changedUser = await collection.findOne({ email: (userEmail) }, { projection: { password: 0 } });
      return resp.status(200).send(changedUser);
    } catch (error) {
      /* */
    }
    next();
  },
  deleteUser: async (req, resp, next) => {
    const userEmail = req.params.uid;
    if (userEmail !== req.email && req.rol !== 'admin') {
      return next(403);
    }

    try {
      const collection = await connect('users');
      const user = await collection.findOne({ email: (userEmail) });
      if (!user) {
        return next(404);
      }
      await collection.deleteOne(user);
      return resp.status(200).send('the user was deleted');
    } catch (error) {
      console.log(error);
    }
    next();
  },
};
