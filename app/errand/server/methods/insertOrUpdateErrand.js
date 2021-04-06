import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { Errands, Persons } from '../../../models/server';
import { settings } from '../../../settings/server';

Meteor.methods({
	insertOrUpdateErrand(errandData) {
		if (!settings.get('Errand_enabled')) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a errand', { method: 'createErrand' });
		}

		const userId = Meteor.userId();
		const person = Persons.findOne({ userId }, { fields: { surname: 1, name: 1, patronymic: 1 } });

		if (errandData._id) {
			Errands.updateErrand(errandData._id, { ...errandData, chargedTo: { userId, person } });
			return errandData._id;
		}
		return Errands.create({ ...errandData, chargedTo: { userId, person } });
	},
});
