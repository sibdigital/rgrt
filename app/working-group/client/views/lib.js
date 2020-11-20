// Here previousData will define if it is an update or a new entry
export function validate(workingGroupData) {
	const errors = [];

	if (!workingGroupData.workingGroup) {
		errors.push('workingGroup');
	}

	return errors;
}

export function createWorkingGroupData(workingGroup, surname, name, patronymic, position, phone, email, previousData) {
	const workingGroupData = {
	};

	if (previousData) {
		workingGroupData._id = previousData._id;
	}

	workingGroupData.workingGroup = workingGroup;
	workingGroupData.surname = surname;
	workingGroupData.name = name;
	workingGroupData.patronymic = patronymic;
	workingGroupData.position = position;
	workingGroupData.phone = phone;
	workingGroupData.email = email;

	return workingGroupData;
}

export function validateWorkingGroupCompositionData(workingGroupCompositionData) {
	const errors = [];

	if (!workingGroupCompositionData.title) {
		errors.push('title');
	}

	return errors;
}

export function createWorkingGroupCompositionData(title, previousData) {
	const workingGroupCompositionData = {
	};

	if (previousData) {
		workingGroupCompositionData._id = previousData._id;
	}

	workingGroupCompositionData.title = title;

	return workingGroupCompositionData;
}

export function validateWorkingGroupRequestData(workingGroupRequestData) {
	const errors = [];

	if (!workingGroupRequestData.desc) {
		errors.push('desc');
	}

	return errors;
}

export function createWorkingGroupRequestData(desc, previousData) {
	const workingGroupRequestData = {
	};

	if (previousData) {
		workingGroupRequestData._id = previousData._id;
	}

	workingGroupRequestData.desc = desc;

	return workingGroupRequestData;
}

export function validateWorkingGroupRequestMessageData(workingGroupRequestData) {
	const errors = [];

	if (!workingGroupRequestData.description) {
		errors.push('description');
	}

	if (!workingGroupRequestData.number) {
		errors.push('number');
	}

	return errors;
}

export function createWorkingGroupRequestMessageData(description, number, previousData) {
	const workingGroupRequestData = {
	};

	if (previousData) {
		workingGroupRequestData._id = previousData._id;
	}

	workingGroupRequestData.description = description;
	workingGroupRequestData.number = number;

	return workingGroupRequestData;
}
