import { Meteor } from 'meteor/meteor';

import { Councils } from '../../../models';
import { Persons } from '../../../models';

Meteor.methods({
	deletePersonFromCouncil(id, personId) {
		if (!id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'deletePersonFromCouncil', field: 'id' });
		}

		if (!personId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field personId is required', { method: 'deletePersonFromCouncil', field: 'personId' });
		}

		Councils.removePersonFromCouncil(id, personId);
		Persons.removeFromCouncil(id, personId);
	},
});
