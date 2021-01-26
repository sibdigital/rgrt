import { Persons } from '../../../models/server/raw';

export async function findPersons({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await Persons.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
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

export async function findPerson(_id) {
	const cursor = await Persons.findOne({ _id });
	return cursor;
}
