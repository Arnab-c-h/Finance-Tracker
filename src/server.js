const dotenv = require('dotenv');

// Catch synchronous errors before initialization
process.on('uncaughtException', err => {
  console.log('Uncaught exception detected, shutting down immediately...');
  console.log(err.name, err.message);
  console.log(err.stack);
  process.exit(1);
});

dotenv.config({ path: './.env' });

const app = require('./app');
const prisma = require('./utils/prismaClient');

const port = process.env.PORT || 3000;
let server;

prisma.$connect()
  .then(() => {
    console.log('DB connection successful!');
    server = app.listen(port, () => {
      console.log(`App running on port ${port}...`);
    });
  })
  .catch(err => {
    console.error('Error connecting to DB', err);
    process.exit(1);
  });

process.on('unhandledRejection', err => {
  console.log('Unhandled rejection detected, initiating graceful shutdown...');
  console.log(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});