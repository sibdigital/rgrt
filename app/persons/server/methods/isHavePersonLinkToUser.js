import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { Persons, Users } from '../../../models';

Meteor.methods({
	isHavePersonLinkToUser(personId) {
		const user = Users.find({ personId }, {});
		return user ?? {};
	},
});
