import { Meteor } from 'meteor/meteor';

import { Persons } from '../../../models';

Meteor.methods({
	deleteCouncilFromPersons(councilId, persons) {
		if (!councilId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field councilId is required', { method: 'deleteCouncilFromPersons', field: 'councilId' });
		}

		if (!persons) {
			throw new Meteor.Error('error-the-field-is-required', 'The field persons is required', { method: 'deleteCouncilFromPersons', field: 'persons' });
		}

		return persons?.map((person) => Persons.removeFromCouncil(councilId, person._id));
	},
});
