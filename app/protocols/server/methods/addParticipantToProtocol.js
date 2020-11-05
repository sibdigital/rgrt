import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Protocols } from '../../../models';

Meteor.methods({
	addParticipantToProtocol(protocolId, userId) {
		if (!hasPermission(this.userId, 'manage-protocols')) {
			throw new Meteor.Error('not_authorized');
		}

		return Protocols.addParticipant(protocolId, userId);
	}
})
