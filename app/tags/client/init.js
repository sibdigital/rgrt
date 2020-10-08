import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

import { Rooms } from "/app/models";
import { MessageAction } from '../../ui-utils/client';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { TagPicker } from '../../tag-picker';
import { tooltip } from "/app/ui/client/components/tooltip";

Template.room.events({
	'click .add-tag, click [data-message-action="tag-message"]'(event) {
		event.preventDefault();
		event.stopPropagation();
		const data = Blaze.getData(event.currentTarget);
		const { msg: { rid, _id: mid } } = messageArgs(data);
		const user = Meteor.user();
		const room = Rooms.findOne({ _id: rid });

		if (room.ro && !room.reactWhenReadOnly) {
			if (!Array.isArray(room.unmuted) || room.unmuted.indexOf(user.username) === -1) {
				return false;
			}
		}

		if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1) {
			return false;
		}

		TagPicker.open(event.currentTarget, (tag) => Meteor.call('setTag', tag, mid));
	},

	'click .tags > li:not(.add-tag)'(event) {
		event.preventDefault();

		const data = Blaze.getData(event.currentTarget);
		const { msg: { _id: mid } } = messageArgs(data);
		Meteor.call('setTag', $(event.currentTarget).data('tag'), mid, () => {
			tooltip.hide();
		});
	},
});

Meteor.startup(function() {
	Tracker.autorun(() => {
		MessageAction.addButton({
			id: 'tag-message',
			icon: 'tag',
			label: 'Add_Tag',
			context: [
				'message',
				'message-mobile',
				'threads',
			],
			action(event) {
				event.stopPropagation();
				const { msg } = messageArgs(this);
				TagPicker.open(event.currentTarget, (tag) => Meteor.call('setTag', tag, msg._id));
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
			order: 2,
			group: ['message', 'menu'],
		});
	});
});
