const cors = require('cors');
const express = require('express');
class AppController {
  constructor() {
    require('dotenv/config');
    this.models();
    this.express = express();
    this.middlewares();
    this.routes();
  }

  models() {
    require('./models/Tool');
    require('./models/User');
  }

  middlewares() {
    this.express.use(express.json());
    this.express.use(cors({}));
  }

  routes() {
    this.express.use(require('./routes'));
  }
}

module.exports = new AppController().express;
