// Here previousData will define if it is an update or a new entry
export function validateProtocolData(protocolData) {
	const errors = [];

	if (!protocolData.d) {
		errors.push('Protocol_Date');
	}

	if (isNaN(protocolData.num)) {
		errors.push('Protocol_Number');
	}

	if (!protocolData.place) {
		errors.push('Protocol_Place');
	}

	return errors;
}

export function createProtocolData(date, number, place, previousData = null) {
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

export function createSectionData(number, name = '', speakers = '', previousData) {
	const sectionData = {
	};

	if (previousData) {
		sectionData._id = previousData._id;
	}
	sectionData.num = number;
	sectionData.name = name;
	sectionData.speakers = speakers;

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

export function createItemData(number, name, responsible, expireAt = '', status = null, previousData = null) {
	const itemData = {
	};

	if (previousData) {
		itemData._id = previousData._id;
		itemData.status = status;
	} else {
		itemData.status = { state: 1, title: 'Новое' };
	}

	if (responsible) {
		itemData.responsible = responsible;
	} else {
		itemData.responsible = [];
	}

	itemData.num = number;
	itemData.name = name;
	itemData.expireAt = expireAt;

	return itemData;
}
