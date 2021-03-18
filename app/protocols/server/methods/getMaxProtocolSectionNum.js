import { Meteor } from 'meteor/meteor';

import { Protocols } from '../../../models';

Meteor.methods({
	getMaxProtocolSectionNum(protocolId) {
		return Protocols.getMaxProtocolSectionNum(protocolId);
	},
});
