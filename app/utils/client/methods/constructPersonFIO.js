/*
	input: @person - Object
		Object format: {
			surname: string,
			name: string,
			patronymic: string,
		}

	method returns short full name in format surname.n.p.

	output: empty string if !person or person haven't surname, name, patronymic
			string like surname.n.p.
*/
export function constructPersonFIO(responsible) {
	if (!responsible || typeof responsible !== 'object') {
		return responsible;
	}
	if (!responsible.surname && !responsible.name && !responsible.patronymic) {
		return responsible;
	}
	return [responsible.surname ?? '', ' ', responsible.name?.substr(0, 1) ?? '', '.', responsible.patronymic?.substr(0, 1) ?? '', '.'].join('');
}

/*
	input: @person - Object
		Object format: {
			surname: string,
			name: string,
			patronymic: string,
		}

	method returns full name in format surname name patronymic

	output: empty string if !person or person haven't surname, name, patronymic
			string like: surname name patronymic
*/
export function constructPersonFullFIO(person) {
	if (!person || typeof person !== 'object') {
		return '';
	}
	if (!person.surname && !person.name && !person.patronymic) {
		return '';
	}
	return [person.surname ?? '', person.name ?? '', person.patronymic ?? ''].join(' ');
}
