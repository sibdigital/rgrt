import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../../../ui-utils/client';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'errand-created',
		system: false,
		message: 'errand-created',
		data(message) {
			return {
				message: `<svg class="rc-icon" aria-hidden="true"><use xlink:href="#checkmark-circled"></use></svg> ${ message.msg }`,
			};
		},
	});
});
