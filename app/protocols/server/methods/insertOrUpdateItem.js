import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Protocols, ProtocolItemsPersonsResponsible } from '../../../models';

Meteor.methods({
	insertOrUpdateItem(protocolId, sectionId, item) {
		// if (!hasPermission('manage-protocols', Meteor.userId)) {
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

		let _id = null;
		const protocolItemsPersonsResponsible = { protocolId, sectionId, itemId: item._id, persons: item.responsible.filter((person) => person.userId).map((person) => ({ _id: person._id })) };

		if (!item._id) {
			_id = Protocols.createItem(protocolId, sectionId, item);
			protocolItemsPersonsResponsible.itemId = _id;
			!!_id && ProtocolItemsPersonsResponsible.create(protocolItemsPersonsResponsible);
		} else {
			_id = Protocols.updateItem(protocolId, sectionId, item);
			!!_id && ProtocolItemsPersonsResponsible.updateProtocolItemsPersonsResponsible(protocolItemsPersonsResponsible);
		}

		return _id;
	},
});
