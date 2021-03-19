// Here previousData will define if it is an update or a new entry
export function validate(personData) {
	const errors = [];

	if (!personData.surname) {
		errors.push('surname');
	}

	return errors;
}

export function createPerson({ personToSave }, { previousData }) {
	const personData = {
		...previousData,
	};
	personData.key && delete personData.key;
	personData.index && delete personData.index;

	if (previousData && previousData._id) {
		personData._id = previousData._id;
	}
	const { surname, name, patronymic, phone, email, organization, position, weight, avatarSource = {} } = personToSave;

	surname && Object.assign(personData, { surname });
	name && Object.assign(personData, { name });
	patronymic && Object.assign( personData, { patronymic });
	phone && Object.assign(personData, { phone });
	email && Object.assign(personData, { email });
	position && Object.assign(personData, { position });
	organization && Object.assign(personData, { organization });
	weight && Object.assign(personData, { weight });
	avatarSource && Object.assign(personData, { avatarSource });

	// console.dir({ personData, personToSave });
	return personData;
}
