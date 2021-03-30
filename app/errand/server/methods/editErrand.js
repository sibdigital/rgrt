import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { Errands } from '../../../models/server';
import { settings } from '../../../settings/server';

Meteor.methods({
	editErrand(errandData) {
		if (!settings.get('Errand_enabled')) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to edit a errand', { method: 'editErrand' });
		}

		if (!errandData._id) {
			throw new Meteor.Error('error-invalid-errand-id', 'Errand ID cant be empty', { method: 'editErrand' });
		}

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'editErrand' });
		}

		return Errands.updateErrand(errandData._id, errandData);
	},
});
