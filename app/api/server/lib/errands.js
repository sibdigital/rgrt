import { CustomErrand, Messages, Rooms } from '../../../models/server/raw';
import { canAccessRoomAsync } from '/app/authorization/server/functions/canAccessRoom';

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

export async function findDiscussionsWithErrandsFromRoom({ uid, roomId, pagination: { offset, count, sort } }) {
	const room = await Rooms.findOneById(roomId);

	if (!await canAccessRoomAsync(room, { _id: uid })) {
		throw new Error('error-not-allowed');
	}

	const cursor = Messages.findDiscussionsWithErrandsByRoom(roomId, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const messages = await cursor.toArray();

	return {
		messages,
		count: messages.length,
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
