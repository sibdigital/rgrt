import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Councils } from '../../../models';

Meteor.methods({
	insertOrUpdateCouncil(councilData) {
		if (!hasPermission(this.userId, 'manage-councils')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!councilData.d) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Date is required', { method: 'insertOrUpdateCouncil', field: 'Date' });
		}

		if (!s.trim(councilData.desc)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Description is required', { method: 'insertOrUpdateCouncil', field: 'Description' });
		}

		if (!councilData._id) {

			const user = Meteor.user();

			const createCouncil = {
				ts: new Date(),
				u: {
					_id: user._id,
					username: user.username,
				},
				d: new Date(councilData.d),
				desc: councilData.desc,
			};

			const _id = Councils.create(createCouncil);

			return _id;
		}

		return Councils.updateCouncil(councilData._id, councilData);
	},
});
