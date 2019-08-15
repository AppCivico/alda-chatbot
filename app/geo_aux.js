module.exports.getNeighborhood = async (results) => {
	let neighborhood = results.find(x => x.types.includes('sublocality'));
	if (!neighborhood) { neighborhood = results.find(x => x.types.includes('sublocality_level_1')); }
	if (!neighborhood) { neighborhood = results.find(x => x.types.includes('sublocality_level_2')); }
	return neighborhood.long_name;
};
module.exports.checkIfInRio = async (results) => {
	let state = await results.find(x => x.types.includes('administrative_area_level_1')); // administrative_area_level_1 -> state
	if (!state) { state = await results.find(x => x.types.includes('administrative_area_level_2')); }

	let place = 'rio de janeiro';
	if (state.formatted_address) { place = state.formatted_address.toLowerCase(); }

	if ('rio de janeiro'.includes(place) || place.includes('rio de janeiro')) { return true; }
	return false;
};

module.exports.getCityFromGeo = async (results) => {
	let state = await results.find(x => x.types.includes('administrative_area_level_2')); // administrative_area_level_2 -> city
	if (state) {
		state = await state.address_components.find(x => x.types.includes('administrative_area_level_2')); // administrative_area_level_2 -> city
		if (state.long_name) { return state.long_name; }
		return undefined;
	}
	return undefined;
};
