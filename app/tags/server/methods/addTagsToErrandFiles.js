import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Errands } from '../../../models';

Meteor.methods({
	addTagsToErrandFiles(errandId, filesId, tags) {
		if (!errandId) {
			throw new Meteor.Error('Tag_Error_Invalid_Tag', 'Invalid errandId', { method: 'addTagsToErrandFiles' });
		}

		if (!filesId || !_.isArray(filesId)) {
			throw new Meteor.Error('Tag_Error_Invalid_Tag', 'Invalid filesId', { method: 'addTagsToErrandFiles' });
		}

		if (!tags || !_.isArray(tags)) {
			throw new Meteor.Error('Tag_Error_Invalid_Tag', 'Invalid tags', { method: 'addTagsToErrandFiles' });
		}

		const errand = Errands.findOne({ _id: errandId });
		console.dir({ errand, filesId, tags });

		if (errand && errand.documents) {
			errand.documents = errand.documents.map((doc) => {
				if (filesId.find((file) => file._id === doc._id)) {
					doc.tags = tags;
				}
				return doc;
			});
			return Errands.update({ _id: errandId }, { $set: { ...errand } });
		}

		return true;
	},
});
