function getRabbitMqUrl() {
	// Accept either a complete AMQP URL or a host name supplied through the environment.
	const configuredUrl = process.env.RABBITMQ_URL || 'localhost';
	const protocol = process.env.RABBITMQ_PROTOCOL || 'amqp';
	const url = new URL(
		/^[a-z][a-z\d+.-]*:\/\//i.test(configuredUrl)
			? configuredUrl
			: `${protocol}://${configuredUrl}`,
	);

		// Force the selected protocol even when RABBITMQ_URL already contains one.
	url.protocol = protocol + ':';

		// Credentials are optional; when provided, URL handles the required escaping.
	if (process.env.RABBITMQ_USER) {
		url.username = process.env.RABBITMQ_USER;
	}

	if (process.env.RABBITMQ_PASSWORD) {
		url.password = process.env.RABBITMQ_PASSWORD;
	}

	// Encode the virtual host because it is part of the URL path.
	if (process.env.RABBITMQ_VHOST) {
		const vhost = process.env.RABBITMQ_VHOST;
		url.pathname =
			vhost === '/' ? '/' : `/${encodeURIComponent(vhost.replace(/^\/+/, ''))}`;
	}

	return url.toString();
}

module.exports = { getRabbitMqUrl };
