import { ProtocolItemsPersonsResponsible } from '../../../models/server/raw';

export async function findProtocolItemsPersonsResponsible({ query = {}, fields = {}, pagination: { offset, count, sort } }) {
	const cursor = await ProtocolItemsPersonsResponsible.find(query, {
		sort: sort || { time: 1 },
		skip: offset,
		limit: count,
		fields,
	});

	const total = await cursor.count();

	const protocolItemsPersonsResponsible = await cursor.toArray();

	return {
		protocolItemsPersonsResponsible,
		count: protocolItemsPersonsResponsible.length,
		offset,
		total,
	};
}
