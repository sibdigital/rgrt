import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Tags } from '../../../models';
import { Notifications } from '../../../notifications';

Meteor.methods({
	deleteTag(tagId) {
		let tag = null;

		if (hasPermission(this.userId, 'manage-tags')) {
			tag = Tags.findOneById(tagId);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (tag == null) {
			throw new Meteor.Error('Tag_Error_Invalid_Tag', 'Invalid tag', { method: 'deleteTag' });
		}

		Tags.removeById(tagId);
		Notifications.notifyLogged('deleteTag', { tagData: tag });

		return true;
	},
});
