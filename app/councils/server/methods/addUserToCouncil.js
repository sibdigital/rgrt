import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { Councils } from '../../../models';

Meteor.methods({
	addUserToCouncil(id, userId) {
		if (!id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'addUserToCouncil', field: 'id' });
		}

		if (!userId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field person is required', { method: 'addUserToCouncil', field: 'userId' });
		}

		return Councils.addUserToCouncil(id, userId);
	},

	addUsersToCouncil(id, usersId) {
		if (!id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'addUserToCouncil', field: 'id' });
		}

		if (!usersId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field person is required', { method: 'addUserToCouncil', field: 'usersId' });
		}

		return Councils.addUsersToCouncil(id, usersId);
	},
});
