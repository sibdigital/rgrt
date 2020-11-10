import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Protocols } from '../../../models';

const sortItems = (a, b) => {
	if (a.inum > b.inum) {
		return 1;
	}
	if (a.inum < b.inum) {
		return -1;
	}
	return 0;
}

Meteor.methods({
	moveItem(direction, protocolId, sectionId, _id) {
		let protocol = null;

		if (hasPermission(this.userId, 'manage-protocols')) {
			protocol = Protocols.findOneById(protocolId);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (protocol == null) {
			throw new Meteor.Error('Protocol_Error_Invalid_Protocol', 'Invalid protocol', { method: 'moveItem' });
		}

		if (protocol.sections) {
			let section;

			protocol.sections.forEach((currentSection) => {
				if (currentSection._id === sectionId) {
					section = currentSection;
				}
			});

			if (!section) {
				throw new Meteor.Error('Protocol_Error_Invalid_Section', 'Invalid section', { method: 'moveItem' });
			}

			if (section.items) {
				let item;
				let index;

				section.items.sort((s1, s2) => s1.inum - s2.inum).forEach((currentItem, currentIndex) => {
					if (currentItem._id === _id) {
						item = currentItem;
						index = currentIndex;
					}
				});

				if (!item) {
					throw new Meteor.Error('Protocol_Error_Invalid_Item', 'Invalid item', { method: 'moveItem' });
				}

				if (direction === 'down') {
					if (index < section.items.length - 1) {
						const newIndex = section.items[index + 1].inum;
						section.items[index + 1].inum = item.inum;
						item.inum = newIndex;
						section.items.sort(sortItems);
						Protocols.updateProtocol(protocolId, protocol);
						return true;
					}
				} else {
					if (index > 0) {
						const newIndex = section.items[index - 1].inum;
						section.items[index - 1].inum = item.inum;
						item.inum = newIndex;
						section.items.sort(sortItems);
						Protocols.updateProtocol(protocolId, protocol);
						return true;
					}
				}
			} else {
				throw new Meteor.Error('Protocol_Error_Invalid_Item', 'Invalid item', { method: 'moveItem' });
			}
		} else {
			throw new Meteor.Error('Protocol_Error_Invalid_Section', 'Invalid section', { method: 'moveItem' });
		}

		return false;
	},
});
