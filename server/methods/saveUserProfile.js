import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

import { saveCustomFields, passwordPolicy } from '../../app/lib/server';
import { Users } from '../../app/models/server';
import { settings as rcSettings } from '../../app/settings/server';
import { twoFactorRequired } from '../../app/2fa/server/twoFactorRequired';
import { saveUserIdentity } from '../../app/lib/server/functions/saveUserIdentity';
import { compareUserPassword } from '../lib/compareUserPassword';

Meteor.methods({
	saveUserProfile: twoFactorRequired(function(settings, customFields) {
		check(settings, Object);
		check(customFields, Match.Maybe(Object));

		if (!rcSettings.get('Accounts_AllowUserProfileChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'saveUserProfile',
			});
		}

		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'saveUserProfile',
			});
		}

		const user = Users.findOneById(this.userId);

		if (settings.realname || settings.username || settings.surname || settings.patronymic) {
			if (!saveUserIdentity(this.userId, {
				_id: this.userId,
				surname: settings.surname,
				name: settings.realname,
				patronymic: settings.patronymic,
				username: settings.username,
			})) {
				throw new Meteor.Error('error-could-not-save-identity', 'Could not save user identity', { method: 'saveUserProfile' });
			}
		}

		if (settings.statusText || settings.statusText === '') {
			Meteor.call('setUserStatus', null, settings.statusText);
		}

		if (settings.statusType) {
			Meteor.call('setUserStatus', settings.statusType, null);
		}

		if (settings.organization || settings.organization === '' || settings.organization != null) {
			if (typeof settings.organization !== 'string' || settings.organization.length > 150) {
				throw new Meteor.Error('error-invalid-field', 'organization', {
					method: 'saveUserProfile',
				});
			}
			Users.setOrganization(user._id, settings.organization.trim());
		}

		if (settings.position || settings.position === '' || settings.position != null) {
			if (typeof settings.position !== 'string' || settings.position.length > 150) {
				throw new Meteor.Error('error-invalid-field', 'position', {
					method: 'saveUserProfile',
				});
			}
			Users.setPosition(user._id, settings.position.trim());
		}

		if (settings.phone || settings.phone === '' || settings.phone != null) {
			if (typeof settings.phone !== 'string' || settings.phone.length > 100) {
				throw new Meteor.Error('error-invalid-field', 'phone', {
					method: 'saveUserProfile',
				});
			}
			Users.setPhone(user._id, settings.phone.trim());
		}

		if (settings.workingGroup && settings.workingGroup !== 'undefined') {
			Users.setWorkingGroup(user._id, settings.workingGroup);
		}

		if (settings.bio != null) {
			if (typeof settings.bio !== 'string' || settings.bio.length > 260) {
				throw new Meteor.Error('error-invalid-field', 'bio', {
					method: 'saveUserProfile',
				});
			}
			Users.setBio(user._id, settings.bio.trim());
		}

		if (settings.nickname != null) {
			if (typeof settings.nickname !== 'string' || settings.nickname.length > 120) {
				throw new Meteor.Error('error-invalid-field', 'nickname', {
					method: 'saveUserProfile',
				});
			}
			Users.setNickname(user._id, settings.nickname.trim());
		}

		if (settings.email) {
			if (!compareUserPassword(user, { sha256: settings.typedPassword })) {
				throw new Meteor.Error('error-invalid-password', 'Invalid password', {
					method: 'saveUserProfile',
				});
			}

			Meteor.call('setEmail', settings.email);
		}

		// Should be the last check to prevent error when trying to check password for users without password
		if (settings.newPassword && rcSettings.get('Accounts_AllowPasswordChange') === true) {
			if (!compareUserPassword(user, { sha256: settings.typedPassword })) {
				throw new Meteor.Error('error-invalid-password', 'Invalid password', {
					method: 'saveUserProfile',
				});
			}

			// don't let user change to same password
			if (compareUserPassword(user, { plain: settings.newPassword })) {
				throw new Meteor.Error('error-password-same-as-current', 'Entered password same as current password', {
					method: 'saveUserProfile',
				});
			}

			passwordPolicy.validate(settings.newPassword);

			Accounts.setPassword(this.userId, settings.newPassword, {
				logout: false,
			});

			try {
				Meteor.call('removeOtherTokens');
			} catch (e) {
				Accounts._clearAllLoginTokens(this.userId);
			}
		}

		Users.setProfile(this.userId, {});

		if (customFields && Object.keys(customFields).length) {
			saveCustomFields(this.userId, customFields);
		}

		return true;
	}),
});
