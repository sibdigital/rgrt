import { Councils } from '../../../models/server/raw';

export async function findCouncils({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await Councils.find(query, {
		sort: sort || { time: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const councils = await cursor.toArray();

	return {
		councils,
		count: councils.length,
		offset,
		total,
	};
}

export async function findOneCouncil({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await Councils.find(query, {
		sort: sort || { time: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const councils = await cursor.toArray();

	return {
		councils,
		count: councils.length,
		offset,
		total,
	};
}
