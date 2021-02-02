import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Councils } from '../../../models';

Meteor.methods({
	deleteCouncil(councilId) {
		let council = null;

		if (hasPermission(this.userId, 'manage-councils')) {
			council = Councils.findOneById(councilId);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (council == null) {
			throw new Meteor.Error('Council_Error_Invalid_Council', 'Invalid council', { method: 'deleteCouncil' });
		}

		return Councils.removeById(councilId);
	},
});
