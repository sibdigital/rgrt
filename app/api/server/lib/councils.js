import { Councils } from '../../../models/server/raw';

export async function findCouncils({ query = {}, fields = {}, pagination: { offset, count, sort } }) {
	const cursor = await Councils.find(query, {
		fields,
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

export async function findOneCouncil(_id) {
	const cursor = await Councils.findOne({ _id }, { fields: { desc: 1, name: 1, d: 1 } });
	return cursor;
}

export async function findOneCouncilByInviteLink(inviteLink, options = {}) {
	const cursor = await Councils.findCouncilByInviteLink({ inviteLink }, options);
	return cursor;
}

export async function findCouncil(_id, options = {}) {
	const cursor = await Councils.findOne({ _id }, options);
	return cursor;
}
