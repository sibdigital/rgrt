import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Councils } from '../../../models';

Meteor.methods({
	addPersonsToCouncil(id, persons) {
		if (!id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'addPersonToCouncil', field: 'id' });
		}

		if (!persons) {
			throw new Meteor.Error('error-the-field-is-required', 'The field persons is required', { method: 'addPersonToCouncil', field: 'persons' });
		}

		return Councils.addPersonsToCouncil(id, persons);
	},
});
