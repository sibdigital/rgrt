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
			return true;
		}

		if (protocol.sections) {
			let section;
			let prevSection;
			let item;
			let itemIndex;

			protocol.sections.forEach((currentSection) => {
				if (currentSection._id === newSectionId) {
					section = currentSection;
				}
				if (currentSection._id === prevSectionId) {
					prevSection = currentSection;
				}
			});

			if (!section || !prevSection) {
				throw new Meteor.Error('Protocol_Error_Invalid_Section', 'Invalid section', { method: 'moveItem' });
			}

			prevSection.items?.filter((currentItem, index) => {
				if (currentItem._id === itemId) {
					item = currentItem;
					itemIndex = index;
				}
				return currentItem._id !== itemId;
			});

			if (!item) {
				throw new Meteor.Error('Protocol_Error_Invalid_Section', 'Invalid item', { method: 'moveItemToSection' });
			}

		// 	if (section.items) {
		// 		if (direction === 'down') {
		// 			if (index < section.items.length - 1) {
		// 				const newNum = section.items[index + 1].num;
		// 				const newIndex = section.items[index + 1].inum;
		// 				section.items[index + 1].num = item.num;
		// 				section.items[index + 1].inum = item.inum;
		// 				item.num = newNum;
		// 				item.inum = newIndex;
		// 				section.items.sort(sortItems);
		// 				Protocols.updateProtocol(protocolId, protocol);
		// 				return true;
		// 			}
		// 		} else {
		// 			if (index > 0) {
		// 				const newNum = section.items[index - 1].num;
		// 				const newIndex = section.items[index - 1].inum;
		// 				section.items[index - 1].num = item.num;
		// 				section.items[index - 1].inum = item.inum;
		// 				item.num = newNum;
		// 				item.inum = newIndex;
		// 				section.items.sort(sortItems);
		// 				Protocols.updateProtocol(protocolId, protocol);
		// 				return true;
		// 			}
		// 		}
		// 	} else {
		// 		protocol.sections.forEach((currentSection) => {
		// 			if (currentSection._id === newSectionId) {
		// 				section = currentSection;
		// 			}
		// 			if (currentSection._id === prevSectionId) {
		// 				prevSection = currentSection;
		// 			}
		// 		});
		// 		section.items = [];
		// 	}
		// } else {
		// 	throw new Meteor.Error('Protocol_Error_Invalid_Section', 'Invalid section', { method: 'moveItem' });
		}

		return false;
	},
});
