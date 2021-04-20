import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Protocols } from '../../../models';

Meteor.methods({
	moveItemToSection(protocolId, prevSectionId, newSectionId, itemId) {
		let protocol = null;

		if (hasPermission(this.userId, 'manage-protocols')) {
			protocol = Protocols.findOneById(protocolId);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (protocol == null) {
			throw new Meteor.Error('Protocol_Error_Invalid_Protocol', 'Invalid protocol', { method: 'moveItemToSection' });
		}

		if (prevSectionId === newSectionId) {
			return false;
		}

		if (protocol.sections) {
			let section;
			let prevSection;
			let item;

			protocol.sections.forEach((currentSection) => {
				if (currentSection._id === newSectionId) {
					section = currentSection;
				}
				if (currentSection._id === prevSectionId) {
					prevSection = currentSection;
				}
			});

			if (!section || !prevSection || !prevSection.items) {
				throw new Meteor.Error('Protocol_Error_Invalid_Section', 'Invalid section', { method: 'moveItem' });
			}

			prevSection.items = prevSection.items.filter((currentItem, index) => {
				if (currentItem._id === itemId) {
					item = currentItem;
				}
				return currentItem._id !== itemId;
			});

			if (!item) {
				throw new Meteor.Error('Protocol_Error_Invalid_Section', 'Invalid item', { method: 'moveItemToSection' });
			}

			if (section.items) {
				section.items.push(item);
			} else {
				section.items = [item];
			}

			Protocols.updateProtocol(protocolId, protocol);
			return true;
		}

		return false;
	},
});
