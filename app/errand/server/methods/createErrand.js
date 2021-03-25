import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { Errands, Persons } from '../../../models/server';
import { settings } from '../../../settings/server';

Meteor.methods({
	createErrand(errandData) {

		if (!settings.get('Errand_enabled')) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a errand', { method: 'createErrand' });
		}

		if (!errandData.expireAt) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Errand_Expired_date is required', { method: 'createErrand', field: 'Errand_Expired_date' });
		}

		const userId = Meteor.userId();

		const person = Persons.findOne({ userId: userId })

		const initiatedBy = {
			_id: userId,
			surname: person.surname,
			name: person.name,
			patronymic: person.patronymic,
		}

		const chargedTo = { ...errandData.chargedTo };

		const createErrand = {
			t: 'opened',
			ts: new Date(),
			initiatedBy,
			chargedTo,
			desc: errandData.desc,
			expireAt: errandData.expireAt,
		};

		if (errandData.protocol) {
			createErrand.protocol = errandData.protocol;
		}

		return Errands.create(createErrand);
	},
});
