import { Meteor } from 'meteor/meteor';

import { CachedCollectionManager } from '../../../ui-cached-collection';
import { Notifications } from '../../../notifications';
import { Tags } from '../lib/tags';

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() =>
		Notifications.onAll('updateTag', (data) => Tags.update(data.tagData)),
	),
);
