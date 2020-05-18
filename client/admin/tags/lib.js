// Here previousData will define if it is an update or a new entry
export function validate(tagData) {
	const errors = [];

	if (!tagData.name) {
		errors.push('Name');
	}

	return errors;
}

export function createTagData(name = '', previousData) {
	const tagData = {
	};

	if (previousData) {
		tagData._id = previousData._id;
		tagData.previousName = previousData.previousName;
		tagData.name = name.trim();
	} else {
		tagData.name = name.trim();
	}

	return tagData;
}
