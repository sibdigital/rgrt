import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Messages, Rooms, Subscriptions } from '../../../models';
import { callbacks } from '../../../callbacks';

Meteor.methods({
	setTag(tag, messageId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error(203, 'User_logged_out');
		}

		const user = Meteor.user();

		const message = Messages.findOne({ _id: messageId });
		const room = Rooms.findOne({ _id: message.rid });
		console.log(message);

		if (room.ro && !room.reactWhenReadOnly) {
			if (!Array.isArray(room.unmuted) || room.unmuted.indexOf(user.username) === -1) {
				return false;
			}
		}

		if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1) {
			return false;
		}

		if (!Subscriptions.findOne({ rid: message.rid })) {
			return false;
		}

		if (message.private) {
			return false;
		}

		if (message.tags && message.tags[tag] && message.tags[tag].usernames.indexOf(user.username) !== -1) {
			message.tags[tag].usernames.splice(message.tags[tag].usernames.indexOf(user.username), 1);

			if (message.tags[tag].usernames.length === 0) {
				delete message.tags[tag];
			}

			if (_.isEmpty(message.tags)) {
				delete message.tags;
				Messages.unsetTags(messageId);
				callbacks.run('unsetTag', messageId, tag);
			} else {
				Messages.setTags(messageId, message.tags);
				callbacks.run('setTag', messageId, tag);
			}
		} else {
			if (!message.tags) {
				message.tags = {};
			}
			if (!message.tags[tag]) {
				message.tags[tag] = {
					usernames: [],
				};
			}
			message.tags[tag].usernames.push(user.username);

			Messages.setTags(messageId, message.tags);
			console.log(message);
			callbacks.run('setTag', messageId, tag);
		}
	},
});
