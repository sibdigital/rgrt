import { Meteor } from 'meteor/meteor';

import { Errands } from '../../../models/server';

Meteor.methods({
	readAnswer(_id) {
		if (!_id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'readAnswer', field: 'id' });
		}

		return Errands.readAnswer(_id);
	},
});
