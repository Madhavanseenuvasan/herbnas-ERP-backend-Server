const server = require('./app');

PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`The port is running in the port ${PORT}`);
});