import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';

import { Messages,/* EmojiCustom,*/ Subscriptions, Rooms } from '../../models';
import { Notifications } from '../../notifications';
import { callbacks } from '../../callbacks';
import { isTheLastMessage, msgStream } from '../../lib';

const removeUserTag = (message, tag, username) => {
	message.tags[tag].usernames.splice(message.tags[tag].usernames.indexOf(username), 1);
	if (message.tags[tag].usernames.length === 0) {
		delete message.tags[tag];
	}
	return message;
};

export function setTag(room, user, message, tag, shouldReact) {
	tag = `:${ tag.replace(/:/g, '') }:`;

	if (room.ro && !room.reactWhenReadOnly) {
		if (!Array.isArray(room.unmuted) || room.unmuted.indexOf(user.username) === -1) {
			return false;
		}
	}

	if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1) {
		Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: room._id,
			ts: new Date(),
			msg: TAPi18n.__('You_have_been_muted', {}, user.language),
		});
		return false;
	} if (!Subscriptions.findOne({ rid: message.rid })) {
		return false;
	}

	const userAlreadyTagged = Boolean(message.tags) && Boolean(message.tags[tag]) && message.tags[tag].usernames.indexOf(user.username) !== -1;
	// When shouldReact was not informed, toggle the tag.
	if (shouldReact === undefined) {
		shouldReact = !userAlreadyTagged;
	}

	if (userAlreadyTagged === shouldReact) {
		return;
	}
	if (userAlreadyTagged) {
		removeUserTag(message, tag, user.username);
		if (_.isEmpty(message.tags)) {
			delete message.tags;
			if (isTheLastMessage(room, message)) {
				Rooms.unsetTagsInLastMessage(room._id); // TODO
			}
			Messages.unsetTags(message._id);
		} else {
			Messages.setTags(message._id, message.tags);
			if (isTheLastMessage(room, message)) {
				Rooms.setTagsInLastMessage(room._id, message);
			}
		}
		callbacks.run('unsetTag', message._id, tag);
		// callbacks.run('afterUnsetTag', message, { user, tag, shouldReact });
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
		Messages.setTags(message._id, message.tags);
		if (isTheLastMessage(room, message)) {
			Rooms.setTagsInLastMessage(room._id, message);
		}
		callbacks.run('setTag', message._id, tag);
		// callbacks.run('afterSetTag', message, { user, tag, shouldReact });
	}

	msgStream.emit(message.rid, message);
}

Meteor.methods({
	setTag(tag, messageId, shouldReact) {
		const user = Meteor.user();

		const message = Messages.findOneById(messageId);

		const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setTag' });
		}

		if (!message) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setTag' });
		}

		if (!room) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setTag' });
		}

		setTag(room, user, message, tag, shouldReact);
	},
});
