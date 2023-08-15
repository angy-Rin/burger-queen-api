const { ObjectId } = require('mongodb');
const { connect } = require('../connect');

module.exports = {
  postProduct: async (req, resp, next) => {
    try {
      if (req.rol !== 'admin') {
        return next(403);
      }
      if (!req.body.name || !req.body.price) {
        return next(400);
      }
      const collection = await connect('products');
      await collection.insertOne(Object(req.body));
      const newProduct = await collection.findOne({ name: req.body.name });
      return resp.send(newProduct);
    } catch (error) {
      return next(404);
    }
  },
  getProducts: async (req, resp, next) => {
    try {
      const collection = await connect('products');
      const products = await collection.find({}).toArray();
      return resp.send(products);
    } catch (error) {
      return next(404);
    }
  },
  getProduct: async (req, resp, next) => {
    const { productId } = req.params;
    try {
      const collection = await connect('products');
      const product = await collection.findOne({ _id: new ObjectId(productId) });
      return resp.status(200).send(product);
    } catch (error) {
      return next(404);
    }
  },
};
