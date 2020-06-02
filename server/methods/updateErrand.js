import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { hasPermission } from '../../app/authorization';
import { Errands, Users } from '../../app/models';
import { settings } from '../../app/settings/server';


Meteor.methods({
	updateErrand({ query }) {
		const user = Meteor.user();
		console.log('updateErrand', query)
		// type === users
		if (!hasPermission(user._id, 'view-outside-room') || !hasPermission(user._id, 'view-d-room')) {
			return;
		}

		const { _id } = query;
		delete query._id;

		const result = Errands.update({ _id }, query);


		return {
			result,
		};
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'updateErrand',
	userId(/* userId*/) {
		return true;
	},
}, 100, 100000);
