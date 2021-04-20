import { Meteor } from 'meteor/meteor';

import { Errands } from '../../../models/server';

Meteor.methods({
	checkErrandByProtocolItemId(protocolItemId) {
		if (!protocolItemId) {
			return false;
		}

		const errand = Errands.findOne({ protocolItemId }, { fields: { _id: 1 } });

		return errand ? errand._id : false;
	},
});
