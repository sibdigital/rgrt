import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Councils } from '../../../models';

Meteor.methods({
	addTagsToCouncilFiles(councilId, filesId, tags) {
		if (!councilId) {
			throw new Meteor.Error('Tag_Error_Invalid_Tag', 'Invalid councilId', { method: 'addTagsToCouncilFiles' });
		}

		if (!filesId || !_.isArray(filesId)) {
			throw new Meteor.Error('Tag_Error_Invalid_Tag', 'Invalid filesId', { method: 'addTagsToCouncilFiles' });
		}

		if (!tags || !_.isArray(tags)) {
			throw new Meteor.Error('Tag_Error_Invalid_Tag', 'Invalid tags', { method: 'addTagsToCouncilFiles' });
		}

		const council = Councils.findOne({ _id: councilId });

		if (council && council.documents) {
			council.documents = council.documents.map((doc) => {
				if (filesId.find((file) => file._id === doc._id)) {
					doc.tags = tags;
				}
				return doc;
			});
			return Councils.update({ _id: councilId }, { $set: { ...council } });
		}

		return true;
	},
});
