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

	if (!workingGroupRequestData.number) {
		errors.push('number');
	}

	if (!workingGroupRequestData.desc) {
		errors.push('desc');
	}

	if (!workingGroupRequestData.date) {
		errors.push('date');
	}

	return errors;
}

export function createWorkingGroupRequestData(number, desc, date, previousData, protocolsItemId) {
	const workingGroupRequestData = {
	};

	if (previousData) {
		workingGroupRequestData._id = previousData._id;
	}

	workingGroupRequestData.number = number;
	workingGroupRequestData.desc = desc;
	workingGroupRequestData.date = date;
	workingGroupRequestData.protocolsItemId = protocolsItemId;

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
		workingGroupRequestData.ts = previousData.ts;
		workingGroupRequestData.inum = previousData.inum;
		workingGroupRequestData.answers = previousData.answers;
	}

	workingGroupRequestData.description = description;
	workingGroupRequestData.number = number;

	return workingGroupRequestData;
}
