import { WorkingGroupMeetings } from '../../../models/server/raw';

export async function findWorkingGroupMeetings({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await WorkingGroupMeetings.find(query, {
		sort: sort || { time: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const workingGroupMeetings = await cursor.toArray();

	return {
		workingGroupMeetings,
		count: workingGroupMeetings.length,
		offset,
		total,
	};
}

export async function findOneWorkingGroupMeeting(_id) {
	const cursor = await WorkingGroupMeetings.findOne({ _id }, { fields: { id: 1 } });
	return cursor;
}
export async function findWorkingGroupMeeting(_id) {
	const cursor = await WorkingGroupMeetings.findOne({ _id });
	return cursor;
}
