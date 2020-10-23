import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { Users } from '../../../models/server';
import { settings } from '../../../settings';
import { hasPermission } from '../../../authorization';
import { RateLimiter } from '../lib';

export const _setSurname = function(userId, surname, fullUser) {
	surname = s.trim(surname);

	if (!userId || (settings.get('Accounts_RequireNameForSignUp') && !surname)) {
		return false;
	}

	const user = fullUser || Users.findOneById(userId);

	// User already has desired name, return
	if (s.trim(user.surname) === surname) {
		return user;
	}

	if (surname) {
		Users.setSurname(user._id, surname);
	} else {
		Users.unsetSurname(user._id);
	}
	user.surname = surname;

	return user;
};

export const setSurname = RateLimiter.limitFunction(_setSurname, 1, 60000, {
	0() { return !Meteor.userId() || !hasPermission(Meteor.userId(), 'edit-other-user-info'); }, // Administrators have permission to change others names, so don't limit those
});
