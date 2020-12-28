import { BaseRaw } from './BaseRaw';

export class WorkingGroupsRequestsRaw extends BaseRaw {
	findWorkingGroupRequestByInviteLink(inviteLink, options) {
		return this.findOne(inviteLink, options);
	}

	findWorkingGroupRequestMailByMailId(requestId, mailId, options) {
		const query = { _id: requestId, mails: { $elemMatch: { _id: mailId } } };
		return this.findOne(query, options);
	}

	addFileIdToMailAnswer(requestId, mailId, answerId, fileId) {
	}
}
