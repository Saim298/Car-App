import app from './app';
import { config } from './app/config/config';
import { Server } from 'http';

async function main() {
  const server: Server = app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
  });

  const existHandaller = () => {
    if (server) {
      server.close(() => {
        console.info('Server is Closed !!');
      });
    }
    process.exit(1);
  };

  process.on('uncaughtException', (error) => {
    console.log(error);
    existHandaller();
  });

  process.on('unhandledRejection', (error) => {
    console.log(error);
    existHandaller();
  });
}

main();
