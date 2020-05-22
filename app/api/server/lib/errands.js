import { CustomErrand } from '../../../models/server/raw';

export async function findErrands({ query = {}, options: { offset, count, sort } }) {
	const cursor = await CustomErrand.find(query, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const errands = await cursor.toArray();

	return {
		errands,
		count: errands.length,
		offset,
		total,
	};
}

/*
export async function findErrandsOnMessage({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await CustomErrand.find(query, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const errands = await cursor.toArray();

	return {
		errands,
		count: errands.length,
		offset,
		total,
	};
}*/
