import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { messageBox, modal } from '../../ui-utils/client';
import { t } from '../../utils/client';
// import { settings } from '../../settings/client';

Meteor.startup(function() {
	Tracker.autorun(() => {
		// if (!settings.get('Discussion_enabled')) {
		// 	return messageBox.actions.remove('Create_new', /start-discussion/);
		// }
		messageBox.actions.add('Create_new', 'Errand', {
			id: 'start-errand',
			icon: 'errand',
			condition: () => true,
			action(data) {
				modal.open({
					title: t('Errand_title'),
					modifier: 'modal',
					content: 'CreateErrand',
					data: {
						...data,
						onCreate() {
							modal.close();
						},
					},
					showConfirmButton: false,
					showCancelButton: false,
					confirmOnEnter: false,
				});
			},
		});
	});
});
