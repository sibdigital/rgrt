import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../models';

Meteor.startup(() => {
	// Add permissions for discussion
	const permissions = [
		{ _id: 'send-mail-manually', roles: ['admin', 'secretary'] },
	];

	for (const permission of permissions) {
		Permissions.create(permission._id, permission.roles);
	}
});
