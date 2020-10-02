import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../ui-utils/client';
/* import { settings } from '../../settings';*/

Meteor.startup(function() {
	return TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'errand',
		i18nTitle: 'Errand',
		icon: 'errand',
		template: 'errandsTabbar',
		order: 1,
		condition: () => true, /* settings.get('Discussion_enabled')*/
	});
});
