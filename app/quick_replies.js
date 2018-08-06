async function getOptions(opt) {
	const elements = [];

	opt.forEach((element, index) => {
		elements.push({
			content_type: 'text',
			title: element.menuOptions[index],
			payload: element.menuPostback[index],
		});
	});

	return { quick_replies: elements };
}

module.exports.get = getOptions;
