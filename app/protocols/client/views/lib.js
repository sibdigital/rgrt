// Here previousData will define if it is an update or a new entry
export function validate(protocolData) {
	const errors = [];

	if (!protocolData.d) {
		errors.push('Date');
	}

	if (!protocolData.num) {
		errors.push('Number');
	}

	if (!protocolData.place) {
		errors.push('Place');
	}

	return errors;
}

export function createProtocolData(date, number, place = '', previousData) {
	const protocolData = {
	};

	if (previousData) {
		protocolData._id = previousData._id;
	}
	protocolData.d = date;
	protocolData.num = number;
	protocolData.place = place;

	return protocolData;
}

export function validateSectionData(sectionData) {
	const errors = [];

	if (!sectionData.num) {
		errors.push('Number');
	}

	if (!sectionData.name) {
		errors.push('Name');
	}

	return errors;
}

export function createSectionData(number, name = '', previousData) {
	const sectionData = {
	};

	if (previousData) {
		sectionData._id = previousData._id;
	}
	sectionData.num = number;
	sectionData.name = name;

	return sectionData;
}

export function validateItemData(itemData) {
	const errors = [];

	if (!itemData.num) {
		errors.push('Number');
	}

	if (!itemData.name) {
		errors.push('Name');
	}

	return errors;
}

export function createItemData(number, name, responsible, expireAt = '', previousData) {
	const itemData = {
	};

	if (previousData) {
		itemData._id = previousData._id;
	}
	itemData.num = number;
	itemData.name = name;
	itemData.responsible = responsible;
	itemData.expireAt = expireAt;

	return itemData;
}

export function constructPersonFIO(person) {
	return person.surname + " " + person.name.substr(0,1) + "." + person.patronymic.substr(0,1) + "."
}