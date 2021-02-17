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

export async function findWorkingGroupRequestMailByMailId(requestId, mailId) {
	const cursor = await WorkingGroupsRequests.findWorkingGroupRequestMailByMailId(requestId, mailId, {});
	const mails = cursor.mails ?? [];

	for (let i = 0; i < mails.length; i++) {
		if (mails[i]._id === mailId) {
			return mails[i];
		}
	}
	return {};
}

export async function findWorkingGroupRequestMailAnswerByAnswerId(requestId, mailId, answerId) {
	const cursor = await WorkingGroupsRequests.findOne({ _id: requestId });
	const mails = cursor.mails ?? [];

	for (let i = 0; i < mails.length; i++) {
		if (mails[i]._id === mailId) {
			for (let j = 0; j < mails[i].answers.length; j++) {
				if (mails[i].answers[j]._id === answerId) {
					return mails[i].answers[j];
				}
			}
		}
	}
	return {};
}

export async function findWorkingGroupRequestAnswerByAnswerId(requestId, answerId) {
	const cursor = await WorkingGroupsRequests.findOne({ _id: requestId });
	const answers = cursor.answers ?? [];

	for (let i = 0; i < answers.length; i++) {
		if (answers[i]._id === answerId) {
			return answers[i];
		}
	}
	return {};
}

export async function findWorkingGroupRequestByProtocolsItemId(_id) {
	const cursor = await WorkingGroupsRequests.find()

	const workingGroupsRequest = await cursor.toArray();
	console.log(workingGroupsRequest)
	return {
		workingGroupsRequest
	}
}
