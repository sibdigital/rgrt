import { Meteor } from 'meteor/meteor';

import { Councils, Persons } from '../../../models';

Meteor.methods({
	insertOrUpdateCouncilPerson(council, person) {
		if (!council) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'insertOrUpdateCouncilPerson', field: 'id' });
		}

		if (!person) {
			throw new Meteor.Error('error-the-field-is-required', 'The field person is required', { method: 'insertOrUpdateCouncilPerson', field: 'person' });
		}
		const councilPerson = {
			_id: council._id,
			ts: person.ts,
		};

		Councils.addPersonToCouncil(council._id, person);
		Persons.addToCouncil(councilPerson, person._id);
	},
});
