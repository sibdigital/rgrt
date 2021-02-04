import { Agendas } from '../../../models/server/raw';

export async function findAgendas({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await Agendas.find(query, {
		sort: sort || { createdAt: -1 },
		skip: offset || 0,
		limit: count || 50,
	});

	const total = await cursor.count();

	const agendas = await cursor.toArray();

	return {
		agendas,
		count: agendas.length,
		offset,
		total,
	};
}

export async function findAgenda(_id) {
	const cursor = await Agendas.findOne({ _id });
	return cursor;
}

export async function findByCouncilId(councilId, options = {}) {
	const cursor = await Agendas.findOne({ councilId }, options);
	return cursor;
}
