// Here previousData will define if it is an update or a new entry
export function validate(workingGroupData) {
	const errors = [];

	if(!workingGroupData.workingGroupType) {
		errors.push('workingGroupType');
	}

	if (!workingGroupData.name) {
		errors.push('Name');
	}

	if (!workingGroupData.surname) {
		errors.push('Surname');
	}

	if (!workingGroupData.patronymic) {
		errors.push('patronymic');
	}

	if (!workingGroupData.position) {
		errors.push('position');
	}

	if (!workingGroupData.phone) {
		errors.push('phone');
	}

	if (!workingGroupData.email) {
		errors.push('email');
	}

	return errors;
}

export function createWorkingGroupData(workingGroupType, surname, name, patronymic, position, phone, email, previousData) {
	const workingGroupData = {
	};

	if (previousData) {
		workingGroupData._id = previousData._id;
	}

	workingGroupData.workingGroupType = workingGroupType;
	workingGroupData.surname = surname;
	workingGroupData.name = name;
	workingGroupData.patronymic = patronymic;
	workingGroupData.position = position;
	workingGroupData.phone = phone;
	workingGroupData.email = email;

	return workingGroupData;
}
