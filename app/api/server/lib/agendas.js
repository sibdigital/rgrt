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

export async function findAgenda(_id, options = {}) {
	const cursor = await Agendas.findOne({ _id }, options);
	return cursor;
}

export async function findByCouncilId(councilId, options = {}) {
	const cursor = await Agendas.findOne({ councilId }, options);
	return cursor;
}

export async function getNumberCount() {
	const cursor = await Agendas.find({}, { sort: { numberCount: -1 }, limit: 1, fields: { numberCount: 1 } });
	const agendas = await cursor.toArray();
	if (agendas.length > 0) {
		return agendas[0];
	}
	return {};
}
