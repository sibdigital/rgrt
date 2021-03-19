import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Protocols } from '../../../models';

const sortSections = (a, b) => {
	if (a.inum > b.inum) {
		return 1;
	}
	if (a.inum < b.inum) {
		return -1;
	}
	return 0;
}

Meteor.methods({
	moveSection(direction, protocolId, _id) {
		let protocol = null;

		if (hasPermission(this.userId, 'manage-protocols')) {
			protocol = Protocols.findOneById(protocolId);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (protocol == null) {
			throw new Meteor.Error('Protocol_Error_Invalid_Protocol', 'Invalid protocol', { method: 'moveSection' });
		}

		if (protocol.sections) {
			let section;
			let index;

			protocol.sections.forEach((currentSection, currentIndex) => {
				if (currentSection._id === _id) {
					section = currentSection;
					index = currentIndex;
				}
			});

			if (!section) {
				throw new Meteor.Error('Protocol_Error_Invalid_Section', 'Invalid section', { method: 'moveSection' });
			}

			if (direction === 'down') {
				if (index < protocol.sections.length - 1) {
					const newNum = protocol.sections[index + 1].num;
					const newIndex = protocol.sections[index + 1].inum;
					protocol.sections[index + 1].num = section.num;
					protocol.sections[index + 1].inum = section.inum;
					section.num = newNum;
					section.inum = newIndex;
					protocol.sections.sort(sortSections)
					Protocols.updateProtocol(protocolId, protocol);
					return true;
				}
			} else {
				if (index > 0) {
					const newNum = protocol.sections[index - 1].inum;
					const newIndex = protocol.sections[index - 1].inum;
					protocol.sections[index - 1].num = section.num;
					protocol.sections[index - 1].inum = section.inum;
					section.num = newNum;
					section.inum = newIndex;
					protocol.sections.sort(sortSections);
					Protocols.updateProtocol(protocolId, protocol);
					return true;
				}
			}
		} else {
			throw new Meteor.Error('Protocol_Error_Invalid_Section', 'Invalid section', { method: 'moveSection' });
		}

		return false;
	},
});
