// Here previousData will define if it is an update or a new entry
export function validate(personData) {
	const errors = [];

	if (!personData.surname) {
		errors.push('surname');
	}

	return errors;
}

export function createPerson(surname, name, patronymic, phone, email, previousData) {
	const personData = {
	};

	if (previousData && previousData._id) {
		personData._id = previousData._id;
	}

	personData.surname = surname;
	personData.name = name;
	personData.patronymic = patronymic;
	personData.phone = phone;
	personData.email = email;
    
	return personData;
}
