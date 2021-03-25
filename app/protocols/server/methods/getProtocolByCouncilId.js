import { Meteor } from 'meteor/meteor';

import { findOneProtocolByCouncilId } from '../../../api/server/lib/protocols';

Meteor.methods({
	getProtocolByCouncilId(councilId, options = {}) {
		return findOneProtocolByCouncilId(councilId, options);
	},
});
