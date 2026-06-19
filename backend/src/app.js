const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware');

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.app.url,
  credentials: true,
}));
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(config.apiPrefix, routes);

app.get('/', (_req, res) => {
  res.json({
    name: 'Email Marketing API',
    version: '1.0.0',
    docs: `${config.apiPrefix}/health`,
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
