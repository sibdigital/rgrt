// Here previousData will define if it is an update or a new entry
export function validate(personData) {
	const errors = [];

	if (!personData.surname) {
		errors.push('surname');
	}

	return errors;
}

export function createPerson(surname, name, patronymic, phone, email, previousData, weight) {
	const personData = {
		...previousData,
	};
	personData.key && delete personData.key;
	personData.index && delete personData.index;

	if (previousData && previousData._id) {
		personData._id = previousData._id;
	}

	personData.surname = surname;
	personData.name = name;
	personData.patronymic = patronymic;
	personData.phone = phone;
	personData.email = email;
	personData.weight = weight;

	return personData;
}
