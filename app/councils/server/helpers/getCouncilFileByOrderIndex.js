import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { hasPermission } from '../../../authorization';
import { Councils } from '../../../models';

Meteor.methods({
	getCouncilFileByOrderIndex(councilId, filesIdArray) {
		if (!hasPermission(this.userId, 'manage-councils')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!filesIdArray || !_.isArray(filesIdArray)) {
			throw new Meteor.Error('updateDocumentTag_Invalid', 'Invalid filesIdArray', { method: 'updateDocumentTag' });
		}

		const filesId = [];
		const council = Councils.findOne({ _id: councilId }, { fields: { documents: 1 } });

		console.dir({ councilInGet: council });

		if (!council) {
			return [];
		}

		council.documents.forEach((file) => {
			const findFile = filesIdArray.some((_file) => _file.orderIndex === file.orderIndex && !_file._id);
			if (findFile) {
				filesId.push({ _id: file._id, orderIndex: file.orderIndex });
			}
		});

		return filesId;
	},
});
