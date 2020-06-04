// Here previousData will define if it is an update or a new entry
export function validate(councilData) {
	const errors = [];

	if (!councilData.d) {
		errors.push('Date');
	}

	if (!councilData.desc) {
		errors.push('Description');
	}

	return errors;
}

export function createCouncilData(date, description = '', previousData) {
	const councilData = {
	};

	if (previousData) {
		councilData._id = previousData._id;
	}
	councilData.d = date;
	councilData.desc = description;

	return councilData;
}
