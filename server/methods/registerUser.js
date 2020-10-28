import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import s from 'underscore.string';

import { Users } from '../../app/models';
import { settings } from '../../app/settings';
import { saveCustomFields, validateEmailDomain, passwordPolicy } from '../../app/lib';
import { validateInviteToken } from '../../app/invites/server/functions/validateInviteToken';

Meteor.methods({
	registerUser(formData) {
		const AllowAnonymousRead = settings.get('Accounts_AllowAnonymousRead');
		const AllowAnonymousWrite = settings.get('Accounts_AllowAnonymousWrite');
		const manuallyApproveNewUsers = settings.get('Accounts_ManuallyApproveNewUsers');
		if (AllowAnonymousRead === true && AllowAnonymousWrite === true && formData.email == null) {
			const userId = Accounts.insertUserDoc({}, {
				globalRoles: [
					'anonymous',
				],
				active: true,
			});

			const stampedLoginToken = Accounts._generateStampedLoginToken();

			Accounts._insertLoginToken(userId, stampedLoginToken);
			return stampedLoginToken;
		}
		check(formData, Match.ObjectIncluding({
			email: String,
			pass: String,
			name: String,
			surname: String,
			patronymic: String,
			organization: String,
			position: String,
			phone: String,
			secretURL: Match.Optional(String),
			reason: Match.Optional(String),
		}));


		if (settings.get('Accounts_RegistrationForm') === 'Disabled') {
			throw new Meteor.Error('error-user-registration-disabled', 'User registration is disabled', { method: 'registerUser' });
		}

		if (settings.get('Accounts_RegistrationForm') === 'Secret URL' && (!formData.secretURL || formData.secretURL !== settings.get('Accounts_RegistrationForm_SecretURL'))) {
			if (!formData.secretURL) {
				throw new Meteor.Error('error-user-registration-secret', 'User registration is only allowed via Secret URL', { method: 'registerUser' });
			}

			try {
				validateInviteToken(formData.secretURL);
			} catch (e) {
				throw new Meteor.Error('error-user-registration-secret', 'User registration is only allowed via Secret URL', { method: 'registerUser' });
			}
		}

		passwordPolicy.validate(formData.pass);

		validateEmailDomain(formData.email);

		const userData = {
			email: s.trim(formData.email.toLowerCase()),
			password: formData.pass,
			name: formData.name,
			reason: formData.reason,
			surname: formData.surname,
			patronymic: formData.patronymic,
			organization: formData.organization,
			position: formData.position,
			phone: formData.phone,
			workingGroup: formData.workingGroup,
		};

		// Check if user has already been imported and never logged in. If so, set password and let it through
		const importedUser = Users.findOneByEmailAddress(formData.email);
		let userId;
		if (importedUser && importedUser.importIds && importedUser.importIds.length && !importedUser.lastLogin) {
			Accounts.setPassword(importedUser._id, userData.password);
			userId = importedUser._id;
		} else {
			userId = Accounts.createUser(userData);
		}

		Users.setName(userId, s.trim(formData.name));

		const reason = s.trim(formData.reason) ?? '';
		if (manuallyApproveNewUsers && reason) {
			Users.setReason(userId, reason);
		}
		const surname = s.trim(formData.surname) ?? '';
		if (surname) {
			Users.addSurname(userId, surname);
		}
		const patronymic = s.trim(formData.patronymic) ?? '';
		if (patronymic) {
			Users.addPatronymic(userId, patronymic);
		}
		const organization = s.trim(formData.organization) ?? '';
		if (organization) {
			Users.addOrganization(userId, organization);
		}
		const position = s.trim(formData.position) ?? '';
		if (position) {
			Users.addPosition(userId, position);
		}
		const phone = s.trim(formData.phone) ?? '';
		if (phone) {
			Users.addPhone(userId, phone);
		}
		if (formData.workingGroup && formData.workingGroup !== 'undefined') {
			Users.setWorkingGroup(userId, formData.workingGroup);
		}

		saveCustomFields(userId, formData);

		try {
			Accounts.sendVerificationEmail(userId, userData.email);
		} catch (error) {
			// throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }
		}

		return userId;
	},
});
