import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Errands } from '../../../models';

Meteor.methods({
	deleteErrand(errandId) {
		let errand = Errands.findOneById(errandId);

		if (errand == null) {
			throw new Meteor.Error('Errand_Error_Invalid_Errand', 'Invalid errand', { method: 'deleteErrand' });
		}

		Errands.removeById(errandId);

		return true;
	},
});
