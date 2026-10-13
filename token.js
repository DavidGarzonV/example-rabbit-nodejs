const jwt = require('jsonwebtoken');

function generateToken(headerName) {
	const payloadValue = process.env.JWT_PAYLOAD;
	const headerValue = process.env.JWT_HEADER;

	if (!headerName?.trim() || !payloadValue?.trim() || !headerValue?.trim()) {
		return null;
	}

	const payload = JSON.parse(payloadValue);
	const header = JSON.parse(headerValue);

	return jwt.sign(payload, 'secreto-solo-para-pruebas', {
		algorithm: 'HS256',
		header,
		expiresIn: '5m',
	});
}

module.exports = { generateToken };
