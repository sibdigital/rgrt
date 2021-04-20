import { Persons } from '../../../models/server/raw';

export async function findPersons({ query = {}, fields = {}, pagination: { offset, count, sort } }) {
	const cursor = await Persons.find(query, {
		sort: sort ?? { surname: 1 },
		skip: offset,
		limit: count,
		fields,
	});

	const total = await cursor.count();

	const persons = await cursor.toArray();

	return {
		persons,
		count: persons.length,
		offset,
		total,
	};
}

export async function findPerson(query, options = {}) {
	const cursor = await Persons.findOne(query, options);
	return cursor;
}
