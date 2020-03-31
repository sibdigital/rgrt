import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

import { MessageAction } from '../../ui-utils/client';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';

Meteor.startup(function() {
	Tracker.autorun(() => {
		MessageAction.addButton({
			id: 'tag-message',
			icon: 'add-reaction', // TODO создать иконку для тегов
			label: 'Add_Tag',
			context: [
				'message',
				'message-mobile',
				'threads',
			],
			action(event) {
				event.stopPropagation();
				const { msg } = messageArgs(this);
				const result = prompt('Введите тэг', '');
				console.log(result);
				console.log(msg._id);
				Meteor.call('setTag', `:${ result }:`, msg._id);
			},
			condition({ msg: message, u: user, room, subscription }) {
				if (!room) {
					return false;
				}

				if (room.ro && !room.reactWhenReadOnly) {
					if (!Array.isArray(room.unmuted) || room.unmuted.indexOf(user.username) === -1) {
						return false;
					}
				}

				if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1) {
					return false;
				}

				if (!subscription) {
					return false;
				}

				if (message.private) {
					return false;
				}

				return true;
			},
			order: -3,
			group: ['message', 'menu'],
		});
	});
});
