const amqp = require('amqplib');
const { getRabbitMqUrl } = require('./rabbitmq');

async function receiveTasks({ closeAfterMessage = false } = {}) {
	try {
		// Build the connection URL from the environment before opening the AMQP connection.
		const rabbitMqUrl = getRabbitMqUrl();
		console.log(
			'[Consumer] Connecting to RabbitMQ',
			rabbitMqUrl.replace(/:\/\/[^@]+@/, '://***@'),
			'...',
		);
		const connection = await amqp.connect(rabbitMqUrl);
		const channel = await connection.createChannel();

		// The queue name and type can be changed without modifying the application code.
		const queue = process.env.RABBITMQ_QUEUE || 'test-queue';
		const queueType = process.env.RABBITMQ_QUEUE_TYPE || 'classic';

		// Declare a durable queue so RabbitMQ keeps it after a broker restart.
		// If it already exists, RabbitMQ verifies that its settings match.
		await channel.assertQueue(queue, {
			durable: true,
			arguments: { 'x-queue-type': queueType },
		});

		// Messages are published to the exchange, not directly to the queue.
		// Both producer and consumer must use the same exchange configuration.
		const exchangeName = process.env.RABBITMQ_EXCHANGE || 'status';
		await channel.assertExchange(exchangeName, 'topic', { durable: true });

		// Bind the queue to the routing key used by the producer. Only messages
		// matching this pattern will be delivered to this queue.
		const queueName = queue;
		const routingKeyPattern =
			process.env.RABBITMQ_ROUTING_KEY || 'online';
		await channel.bindQueue(queueName, exchangeName, routingKeyPattern);

		console.log(
			`[*] Waiting for messages in queue "${queue}". To exit press CTRL+C`,
		);

		// Keep the consumer in manual-acknowledgement mode so a message can be
		// redelivered if processing fails before the acknowledgement is sent.
		let consumerTag;
		const consumer = await channel.consume(
			queue,
			async (msg) => {
				if (msg !== null) {
					console.log(`[x] Message received: "${msg.content.toString()}"`);
					// Acknowledge successful processing so RabbitMQ removes the message.
					channel.ack(msg);

					if (closeAfterMessage) {
						// Stop this one-shot consumer and close AMQP resources so Node can exit.
						await channel.cancel(consumerTag);
						await channel.close();
						await connection.close();
					}
				}
			},
			{ noAck: false },
		);
		consumerTag = consumer.consumerTag;
	} catch (error) {
		console.error('Consumer error:', error);
	}
}

module.exports = { receiveTasks };
