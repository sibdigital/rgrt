import { BaseRaw } from './BaseRaw';

export class WorkingGroupsRequestsRaw extends BaseRaw {
	findWorkingGroupRequestByInviteLink(inviteLink, options) {
		return this.findOne(inviteLink, options);
	}

	addFileIdToMailAnswer(requestId, mailId, answerId, fileId) {
	}
}
