import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Protocols } from '../../../models';

Meteor.methods({
	deleteProtocol(protocolId) {
		let protocol = null;

		if (hasPermission(this.userId, 'manage-protocols')) {
			protocol = Protocols.findOneById(protocolId);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (protocol == null) {
			throw new Meteor.Error('Protocol_Error_Invalid_Protocol', 'Invalid protocol', { method: 'deleteProtocol' });
		}

		Protocols.removeById(protocolId);

		return true;
	},
});
