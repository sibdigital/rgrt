import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Protocols } from '../../../models';

Meteor.methods({
	insertOrUpdateSection(protocolId, section) {
		if (!hasPermission(this.userId, 'manage-protocols')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!protocolId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field ProtocolId is required', { method: 'insertOrUpdateSection', field: 'ProtocolId' });
		}

		if (!s.trim(section.num)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Number is required', { method: 'insertOrUpdateSection', field: 'Number' });
		}

		if (!s.trim(section.name)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', { method: 'insertOrUpdateSection', field: 'Name' });
		}

		if (!section._id) {
			return Protocols.createSection(protocolId, section)
		}

		return Protocols.updateSection(protocolId, section);
	},
});
