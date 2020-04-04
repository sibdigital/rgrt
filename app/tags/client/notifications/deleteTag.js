import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../../notifications';
import { CachedCollectionManager } from "/app/ui-cached-collection";
import { Tags } from "/app/tags/client";

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() =>
		Notifications.onAll('deleteTag', (data) => Tags.remove(data.tagData)),
	),
);
