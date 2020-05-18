import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../../notifications';
import { CachedCollectionManager } from "/app/ui-cached-collection";
import { Tags } from '../lib/Tags';

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() =>
		Notifications.onAll('deleteTag', (data) => Tags.remove(data.tagData)),
	),
);
