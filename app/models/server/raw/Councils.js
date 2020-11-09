import { BaseRaw } from './BaseRaw';

export class CouncilsRaw extends BaseRaw {
	findCouncilByInviteLink(inviteLink, options) {
		return this.findOne(inviteLink, options);
	}
}
