import { Meteor } from 'meteor/meteor';

import { Councils } from '../../../models';

Meteor.methods({
	deleteUserFromCouncil(id, userId) {
		if (!id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'addUserToCouncil', field: 'id' });
		}

		if (!userId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field person is required', { method: 'addUserToCouncil', field: 'userId' });
		}

		return Councils.removeUserFromCouncil(id, userId);
	},
});
