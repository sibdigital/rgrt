import { Meteor } from 'meteor/meteor';

import { Persons } from '../../../models';

Meteor.methods({
	addCouncilToPersons(councilId, persons) {
		if (!councilId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field councilId is required', { method: 'addPersonToCouncil', field: 'councilId' });
		}

		if (!persons) {
			throw new Meteor.Error('error-the-field-is-required', 'The field persons is required', { method: 'addPersonToCouncil', field: 'persons' });
		}

		return persons?.map((person) => Persons.addToCouncil({ _id: councilId, ts: person.ts }, person._id));
	},
});
