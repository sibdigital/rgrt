import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { hasPermission } from '../../../authorization';
import { Councils, Uploads } from '../../../models';

Meteor.methods({
	updateDocumentTag(councilId, filesIdArray, tag) {
		if (!hasPermission(this.userId, 'manage-councils')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!councilId) {
			throw new Meteor.Error('updateDocumentTag_Invalid', 'Invalid councilId', { method: 'updateDocumentTag' });
		}

		if (!filesIdArray || !_.isArray(filesIdArray)) {
			throw new Meteor.Error('updateDocumentTag_Invalid', 'Invalid filesIdArray', { method: 'updateDocumentTag' });
		}

		if (!tag || !tag._id) {
			throw new Meteor.Error('updateDocumentTag_Invalid', 'Invalid tag', { method: 'updateDocumentTag' });
		}

		Councils.updateFilesTag(councilId, filesIdArray, tag);
		filesIdArray.forEach((fileId) => Uploads.updateFileTag(fileId, tag));
	},
});
