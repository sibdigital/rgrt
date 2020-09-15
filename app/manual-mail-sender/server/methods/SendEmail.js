import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import * as Mailer from '../../../mailer';
import { settings } from '../../../settings/index';

Meteor.methods({
	sendEmailManually(data) {
		if (!hasPermission(this.userId, 'send-mail-manually')) {
			throw new Meteor.Error('error-action-not-allowed', 'Mailing is not allowed', {
				method: 'sendEmailManually',
				action: 'Mailing',
			});
		}

		if (!s.trim(data.email)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Email is required', { method: 'sendEmailManually', field: 'Email' });
		}

		if (!s.trim(data.topic)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Topic is required', { method: 'sendEmailManually', field: 'Topic' });
		}

		if (!s.trim(data.message)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Message is required', { method: 'sendEmailManually', field: 'Message' });
		}

		if (!s.trim(data.message.replace(/<[^>]+>/g, ''))) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Message is required', { method: 'sendEmailManually', field: 'Message' });
		}

		const emails = _.compact(data.email.trim().split(','));
		const invalidMails = [];

		_.each(emails, (email) => {
			if (!Mailer.checkAddressFormat(email.trim())) {
				invalidMails.push(email);
			}
		});

		if (invalidMails.length !== 0) {
			throw new Meteor.Error('error-invalid-email', `Invalid email ${ invalidMails }`, {
				method: 'sendEmailManually',
				invalidMails,
			});
		}

		let attachments;

		if (data.files) {
			attachments = data.files.map((file) => {
				return {
					filename: file.filename,
					content: new Buffer(file.content, 'base64'),
					contentType: file.contentType
				}
			});
		}

		_.each(emails, (email) => {
			const receiver = s.trim(email);
			Mailer.send({
				to: [receiver],
				from: settings.get('From_Email'),
				replyTo: receiver,
				subject: data.topic,
				html: data.message,
				attachments: attachments
			});
		});

		return {
			success: true,
		};
	},
});
