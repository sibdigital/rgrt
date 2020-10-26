import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { Users } from '../../../models/server';
import { settings } from '../../../settings';
import { hasPermission } from '../../../authorization';
import { RateLimiter } from '../lib';

export const _setPatronymic = function(userId, patronymic, fullUser) {
	patronymic = s.trim(patronymic);

	if (!userId || (settings.get('Accounts_RequireNameForSignUp') && !patronymic)) {
		return false;
	}

	const user = fullUser || Users.findOneById(userId);

	// User already has desired name, return
	if (s.trim(user.patronymic) === patronymic) {
		return user;
	}

	if (patronymic) {
		Users.setPatronymic(user._id, patronymic);
	} else {
		Users.unsetPatronymic(user._id);
	}
	user.patronymic = patronymic;

	return user;
};

export const setPatronymic = RateLimiter.limitFunction(_setPatronymic, 1, 60000, {
	0() { return !Meteor.userId() || !hasPermission(Meteor.userId(), 'edit-other-user-info'); }, // Administrators have permission to change others names, so don't limit those
});
