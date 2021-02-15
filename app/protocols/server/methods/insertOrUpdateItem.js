import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Protocols } from '../../../models';

Meteor.methods({
	insertOrUpdateItem(protocolId, sectionId, item) {
		// if (!hasPermission(this.userId, 'manage-protocols')) {
		// 	throw new Meteor.Error('not_authorized');
		// }

		if (!protocolId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field ProtocolId is required', { method: 'insertOrUpdateItem', field: 'ProtocolId' });
		}

		if (!sectionId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field SectionId is required', { method: 'insertOrUpdateItem', field: 'SectionId' });
		}

		if (!s.trim(item.num)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Number is required', { method: 'insertOrUpdateItem', field: 'Number' });
		}

		if (!s.trim(item.name)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', { method: 'insertOrUpdateItem', field: 'Name' });
		}

		if (!item._id) {
			return Protocols.createItem(protocolId, sectionId, item);
		}

		return Protocols.updateItem(protocolId, sectionId, item);
	},
});
