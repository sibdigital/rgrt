import { Meteor } from 'meteor/meteor';

import { Tags } from '../../../models';

Meteor.methods({
	listTags(options = {}) {
		return Tags.find(options).fetch();
	},
});
