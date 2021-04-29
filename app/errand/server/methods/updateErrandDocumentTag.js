import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Errands, Uploads } from '../../../models';

Meteor.methods({
	updateErrandDocumentTag(errandId, filesIdArray, tag) {
		if (!errandId) {
			throw new Meteor.Error('updateErrandDocumentTag_Invalid', 'Invalid councilId', { method: 'updateErrandDocumentTag' });
		}

		if (!filesIdArray || !_.isArray(filesIdArray)) {
			throw new Meteor.Error('updateErrandDocumentTag_Invalid', 'Invalid filesIdArray', { method: 'updateErrandDocumentTag' });
		}

		if (!tag || !tag._id) {
			throw new Meteor.Error('updateErrandDocumentTag_Invalid', 'Invalid tag', { method: 'updateErrandDocumentTag' });
		}

		Errands.updateFilesTag(errandId, filesIdArray, tag);
		filesIdArray.forEach((fileId) => Uploads.updateFileTag(fileId, tag));
	},
});
