import { Meteor } from 'meteor/meteor';

import { Protocols } from '../../../models';

Meteor.methods({
	getMaxProtocolNum() {
		return Protocols.getMaxProtocolNum();
	},
});
