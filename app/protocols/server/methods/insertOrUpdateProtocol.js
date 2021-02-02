import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Protocols } from '../../../models';

Meteor.methods({
	insertOrUpdateProtocol(protocolData) {
		if (!hasPermission(this.userId, 'manage-protocols')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!protocolData.d) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Date is required', { method: 'insertOrUpdateProtocol', field: 'Date' });
		}

		if (!s.trim(protocolData.num)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Number is required', { method: 'insertOrUpdateProtocol', field: 'Number' });
		}

		if (!s.trim(protocolData.place)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Place is required', { method: 'insertOrUpdateProtocol', field: 'Place' });
		}

		if (!protocolData._id) {

			const user = Meteor.user();

			const createProtocol = {
				ts: new Date(),
				u: {
					_id: user._id,
					username: user.username,
				},
				d: new Date(protocolData.d),
				num: protocolData.num,
				place: protocolData.place,
				sections: [],
				councilId: protocolData.councilId,
				participants: protocolData.participants,
			};

			const _id = Protocols.create(createProtocol);

			return _id;
		}

		return Protocols.updateProtocol(protocolData._id, protocolData);
	},
});
