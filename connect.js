const { MongoClient } = require('mongodb');
const config = require('./config');

const { dbUrl } = config;

const connect = async (collectionName) => {
  // TODO: Conexión a la Base de Datos
  try {
    const client = new MongoClient(dbUrl);
    await client.connect();
    const db = client.db();
    const collection = db.collection(collectionName);
    return collection;
  } catch (error) {
    console.error('Error en connect.js');
  }
};
module.exports = { connect };
