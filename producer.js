const amqp = require('amqplib');
const { getRabbitMqUrl } = require('./rabbitmq');

async function sendTask(message = 'Hello from Node.js!') {
	try {
		// Resolve the broker URL from the environment before establishing a connection.
		console.log('[Producer] Connecting to RabbitMQ...');
		const rabbitMqUrl = getRabbitMqUrl();
		console.log(
			'[Producer] RabbitMQ URL:',
			rabbitMqUrl.replace(/:\/\/[^@]+@/, '://***@'),
		);
		const connection = await amqp.connect(rabbitMqUrl);
		const channel = await connection.createChannel();

		// Publish through the shared topic exchange so routing is handled by RabbitMQ.
		// The exchange can be selected through the environment for each deployment.
		const exchangeName = process.env.RABBITMQ_EXCHANGE || 'status';
		await channel.assertExchange(exchangeName, 'topic', { durable: true });

		// Declare the queue as well so the producer can be run before the consumer.
		// The consumer creates the binding that routes matching messages to it.
		const queue = process.env.RABBITMQ_QUEUE || 'test-queue';
		const queueType = process.env.RABBITMQ_QUEUE_TYPE || 'classic';
		await channel.assertQueue(queue, {
			durable: true,
			arguments: { 'x-queue-type': queueType },
		});

		// The routing key must match the consumer's binding for the message to arrive.
		// Persistent messages can survive a broker restart when the queue is durable.
		const routingKey =
			process.env.RABBITMQ_ROUTING_KEY || 'online';
		channel.publish(exchangeName, routingKey, Buffer.from(message), {
			persistent: true,
		});
		console.log(`[x] Message sent: "${message}"`);

		// Give the channel time to flush the published message before closing the connection.
		setTimeout(async () => {
			await channel.close();
			await connection.close();
		}, 500);
	} catch (error) {
		console.error('Producer error:', error);
	}
}

module.exports = { sendTask };
