import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Protocols } from '../../../models';

Meteor.methods({
	updateItemStatus(itemId, status) {
		if (!itemId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field itemId is required', { method: 'updateItemStatus', field: 'itemId' });
		}

		if (!status) {
			throw new Meteor.Error('error-the-field-is-required', 'The field status is required', { method: 'updateItemStatus', field: 'status' });
		}

		return Protocols.updateItemStatus(itemId, status);
	},
});
