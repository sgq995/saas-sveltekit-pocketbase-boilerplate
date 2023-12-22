routerAdd('GET', '/hello/:name', (c) => {
	let name = c.pathParam('name');

	return c.json(200, { message: 'Hi ' + name });
});
