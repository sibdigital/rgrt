import { Meteor } from 'meteor/meteor';

import { WorkingGroupsRequests } from '../../../models/server';

Meteor.methods({
	readAnswer(_id, answerId) {
		if (!_id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'readAnswer', field: 'id' });
		}

		// if (!mailId) {
		// 	throw new Meteor.Error('error-the-field-is-required', 'The field mailId is required', { method: 'readAnswer', field: 'mailId' });
		// }

		if (!answerId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field answerId is required', { method: 'readAnswer', field: 'answerId' });
		}

		return WorkingGroupsRequests.readAnswer(_id, answerId);
	},
});
