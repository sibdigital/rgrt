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

		if (isNaN(protocolData.num)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Number is required', { method: 'insertOrUpdateProtocol', field: 'Number' });
		}

		if (!s.trim(protocolData.place)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Place is required', { method: 'insertOrUpdateProtocol', field: 'Place' });
		}

		if (!protocolData._id) {

			const user = Meteor.user();

			if (protocolData.num === 0) {
				protocolData.num = Protocols.getMaxProtocolNum() + 1;
			}

			const createProtocol = {
				ts: new Date(),
				u: {
					_id: user._id,
					username: user.username,
				},
				d: new Date(protocolData.d),
				num: protocolData.num,
				place: protocolData.place
			};

			if (protocolData.council) {
				createProtocol.council = protocolData.council;
			}

			const _id = Protocols.create(createProtocol);

			if (protocolData.sections) {
				protocolData.sections.forEach((sectionData) => {
					const createSection = {
						num: sectionData.num,
						name: sectionData.name,
						speakers: sectionData.speakers
					}
					const sectionId = Protocols.createSection(_id, createSection);

					if (sectionData.items) {
						sectionData.items.forEach((itemData) => {
							Protocols.createItem(_id, sectionId, itemData);
						})
					}
				});
			}

			if (protocolData.participants) {
				protocolData.participants.forEach((p) => {
					Protocols.addParticipant(_id, p);
				})
			}

			return _id;
		}

		return Protocols.updateProtocol(protocolData._id, protocolData);
	},
});
