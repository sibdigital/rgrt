import { WorkingGroupsRequests } from '../../../models/server/raw';

export async function findWorkingGroupsRequests({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await WorkingGroupsRequests.find(query, {
		sort: sort || { time: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const requests = await cursor.toArray();

	return {
		requests,
		count: requests.length,
		offset,
		total,
	};
}

export async function findOneWorkingGroupRequestByInviteLink(inviteLink) {
	const cursor = await WorkingGroupsRequests.findWorkingGroupRequestByInviteLink({ inviteLink }, {});
	return cursor;
}
export async function findWorkingGroupRequest(_id) {
	const cursor = await WorkingGroupsRequests.findOne({ _id });
	return cursor;
}
