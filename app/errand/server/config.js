import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(() => {
	settings.addGroup('Errand', function() {
		// the channel for which errands are created if none is explicitly chosen

		this.add('Errand_enabled', true, {
			group: 'Errand',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
		});
	});

	settings.add('Accounts_Default_User_Preferences_sidebarShowErrand', true, {
		group: 'Accounts',
		section: 'Accounts_Default_User_Preferences',
		type: 'boolean',
		public: true,
		i18nLabel: 'Group_errands',
	});

	const globalQuery = {
		_id: 'RetentionPolicy_Enabled',
		value: true,
	};

	settings.add('RetentionPolicy_DoNotExcludeErrand', true, {
		group: 'RetentionPolicy',
		section: 'Global Policy',
		type: 'boolean',
		public: true,
		i18nLabel: 'RetentionPolicy_DoNotExcludeErrand',
		i18nDescription: 'RetentionPolicy_DoNotExcludeErrand_Description',
		enableQuery: globalQuery,
	});
});
