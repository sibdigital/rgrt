import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Persons } from '../../../models';

Meteor.methods({
	deletePerson(personId) {
		let person = null;

		// if (hasPermission(this.userId, 'manage-persons')) {
		// 	person = Persons.findOneById(personId);
		// } else {
		// 	throw new Meteor.Error('not_authorized');
		// }
		person = Persons.findOneById(personId);
		if (person == null) {
			throw new Meteor.Error('Persons_Error_Invalid_Person', 'Invalid person', { method: 'deletePerson' });
		}

		Persons.removeById(personId);

		return true;
	},
});
