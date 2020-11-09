import { Protocols } from '../../../models/server/raw';

export async function findProtocols({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await Protocols.find(query, {
		sort: sort || { time: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const protocols = await cursor.toArray();

	return {
		protocols,
		count: protocols.length,
		offset,
		total,
	};
}

export async function findProtocol(_id) {
	const cursor = await Protocols.findOne({ _id });
	return cursor;
}
