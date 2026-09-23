const path = require('path');

require('dotenv').config({
  path: path.resolve(process.cwd(), '.env')
});

// Load the RabbitMQ modules after dotenv so they can read the configured environment.
const { receiveTasks } = require('./consumer');
const { sendTask } = require('./producer');

async function main() {
  console.log(`[App] Running in environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[App] RabbitMQ URL configurada: ${process.env.RABBITMQ_URL}`); // Confirm that the environment was loaded.
  
  const mode = process.env.MODE || 'consumer';
  console.log(`[App] Running in mode: ${mode}`);

  // Consumer mode waits for messages; producer mode publishes one message and exits.
  if (mode === 'consumer') {
    await receiveTasks();
  } else if (mode === 'producer') {
    await sendTask({
      routingKey: process.env.RABBITMQ_ROUTING_KEY,
      message: 'Test message triggered from index!'
    });
  } else if (mode === 'both') {
    // Start a one-shot consumer first so its queue binding exists before publishing.
    await receiveTasks({ closeAfterMessage: true });
    setTimeout(async () => {
      await sendTask({
        routingKey: process.env.RABBITMQ_ROUTING_KEY,
        message: 'Test message triggered from index!'
      });
    }, 2000);
  }
}

main();