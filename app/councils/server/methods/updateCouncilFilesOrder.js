import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Councils } from '../../../models';

Meteor.methods({
	updateCouncilFilesOrder(councilId, filesArray) {
		if (!hasPermission(this.userId, 'manage-councils')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!councilId) {
			throw new Meteor.Error('updateCouncilFilesOrder_Invalid', 'Invalid councilId', { method: 'updateCouncilFilesOrder' });
		}

		if (!filesArray) {
			throw new Meteor.Error('updateCouncilFilesOrder_Invalid', 'Invalid filesArray', { method: 'updateCouncilFilesOrder' });
		}

		const arrToSave = filesArray?.map((file, index) => {
			file.orderIndex = index + 1;
			return file;
		});
		console.log(arrToSave);
		Councils.updateFilesOrder(councilId, arrToSave);
		return arrToSave;
	},
});
