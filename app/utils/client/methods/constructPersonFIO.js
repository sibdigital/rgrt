export function constructPersonFIO(person) {
	if (!person) {
		return '';
	}
	return [person.surname ?? '', ' ', person.name?.substr(0, 1) ?? '', '.', person.patronymic?.substr(0, 1) ?? '', '.'].join('');
}

export function constructPersonFullFIO(person) {
	if (!person) {
		return '';
	}
	return [person.surname ?? '', person.name ?? '', person.patronymic ?? ''].join(' ');
}
