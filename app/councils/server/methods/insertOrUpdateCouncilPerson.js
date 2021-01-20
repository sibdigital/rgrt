import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Councils } from '../../../models';
import { Persons } from '../../../models';

Meteor.methods({
	insertOrUpdateCouncilPerson(id, person) {
		if (!id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'insertOrUpdateCouncilPerson', field: 'id' });
		}

		if (!person) {
			throw new Meteor.Error('error-the-field-is-required', 'The field person is required', { method: 'insertOrUpdateCouncilPerson', field: 'person' });
		}

        Councils.addPersonToCouncil(id, person);
        Persons.addToCouncil(id, person._id);
	},
});
