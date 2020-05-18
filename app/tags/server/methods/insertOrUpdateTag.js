import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Notifications } from '../../../notifications';
import { Tags } from '../../../models';

Meteor.methods({
	insertOrUpdateTag(tagData) {
		// if (!hasPermission(this.userId, 'manage-tags')) {
		// 	throw new Meteor.Error('not_authorized');
		// }

		if (!s.trim(tagData.name)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', { method: 'insertOrUpdateTag', field: 'Name' });
		}

		// allow all characters except colon, whitespace, comma, >, <, &, ", ', /, \, (, )
		// more practical than allowing specific sets of characters; also allows foreign languages
		const nameValidation = /[\s,:><&"'\/\\\(\)]/;

		if (nameValidation.test(tagData.name)) {
			throw new Meteor.Error('error-input-is-not-a-valid-field', `${ tagData.name } is not a valid name`, { method: 'insertOrUpdateTag', input: tagData.name, field: 'Name' });
		}

		let matchingResults = [];

		if (tagData._id) {
			matchingResults = Tags.findByNameExceptId(tagData.name, tagData._id).fetch();
		} else {
			matchingResults = Tags.findByName(tagData.name).fetch();
		}

		if (matchingResults.length > 0) {
			throw new Meteor.Error('Tag_Error_Name_Already_In_Use', 'The tag is already in use', { method: 'insertOrUpdateTag' });
		}

		if (!tagData._id) {
			const createTag = {
				name: tagData.name,
			};

			const _id = Tags.create(createTag);

			Notifications.notifyLogged('updateTag', { tagData: createTag });

			return _id;
		}

		if (tagData.name !== tagData.previousName) {
			Tags.setName(tagData._id, tagData.name);
		}

		Notifications.notifyLogged('updateTag', { tagData });

		return true;
	},
});
