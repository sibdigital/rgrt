import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

// import { settings } from '../../settings/client';
import { hasPermission } from '../../authorization/client';
import { MessageAction, modal } from '../../ui-utils/client';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import { t } from '../../utils/client';

Meteor.startup(function() {
	Tracker.autorun(() => {
		// if (!settings.get('Errand_enabled')) {
		// 	return MessageAction.removeButton('start-errand');
		// }

		MessageAction.addButton({
			id: 'start-errand',
			icon: 'errand',
			label: 'Errand_start',
			context: ['message', 'message-mobile'],
			async action() {
				const { msg: message } = messageArgs(this);

				modal.open({
					title: t('Errand_title'),
					modifier: 'modal',
					content: 'CreateErrand',
					data: { rid: message.rid,
						message,
						onCreate() {
							modal.close();
						} },
					confirmOnEnter: false,
					showConfirmButton: false,
					showCancelButton: false,
				});
			},
			condition({ msg: { u: { _id: uid }, drid, dcount }, subscription, u }) {
				if (drid || !isNaN(dcount)) {
					return false;
				}
				if (!subscription) {
					return false;
				}

				return uid !== u._id ? hasPermission('start-errand-other-user') : hasPermission('start-errand');
			},
			order: 1,
			group: 'menu',
		});
	});
});
