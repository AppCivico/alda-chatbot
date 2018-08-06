// const { ContextSimulator } = require('bottender/test-utils');

// const flow = require('../app/flow');
// const handler = require('../app/handler');

// const simulator = new ContextSimulator({
// 	platform: 'messenger',
// });

// console.log(handler);
// it('should work', async () => {
// 	const context = simulator.createTextContext('Vocês são de são paulo?');

// 	await handler.on('event', context);
// 	expect(context.sendText).toBeCalledWith('Não, sou do rio');
// });

const handler = require('../app/handler');

it('should work', async () => {
	const context = {
		state: {
			dialog: 'greetings',
		},
		event: {
			isMessage: true,
			isText: true,
			text: 'Vocês são de são paulo?',
			message: {
				text: 'Vocês são de são paulo?',
			},
		},
		sendText: jest.fn(),
	};

	await handler.on('event', context);

	expect(await context.sendText).toBeCalledWith('Não, sou do rio');
});
