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
