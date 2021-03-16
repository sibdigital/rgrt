import { Protocols } from '../../../models/server/raw';

export async function findProtocols({ query = {}, fields = {}, pagination: { offset, count, sort } }) {
	const cursor = await Protocols.find(query, {
		sort: sort || { time: 1 },
		skip: offset,
		limit: count,
		fields,
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

export async function findProtocolByCouncilId(_id) {
	const cursor = await Protocols.find({
		'council._id': _id
	})

	const protocol = await cursor.toArray();

	return {
		protocol
	}
}

export async function findProtocolByItemId (_id) {
	const cursor = await Protocols.find({
		'sections.items._id': _id
	})

	const protocol = await cursor.toArray();

	return {
		protocol,
		sections: protocol[0].sections
	}
}

export async function findProtocol(_id) {
	const cursor = await Protocols.findOne({ _id });
	return cursor;
}
