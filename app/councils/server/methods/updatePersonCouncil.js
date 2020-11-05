import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { Councils } from '../../../models';

Meteor.methods({
	updatePersonCouncil(id, person, index) {
		if (!id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'updatePersonCouncil', field: 'id' });
		}

		if (!person) {
			throw new Meteor.Error('error-the-field-is-required', 'The field person is required', { method: 'updatePersonCouncil', field: 'person' });
		}


		if (!s.trim(person.firstName)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field firstName is required', { method: 'updatePersonCouncil', field: 'firstName' });
		}

		if (!s.trim(person.lastName)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field lastName is required', { method: 'updatePersonCouncil', field: 'lastName' });
		}

		if (!s.trim(person.position)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field position is required', { method: 'updatePersonCouncil', field: 'position' });
		}

		if (!s.trim(person.phone)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field phone is required', { method: 'updatePersonCouncil', field: 'phone' });
		}

		if (!s.trim(person.email)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field email is required', { method: 'updatePersonCouncil', field: 'email' });
		}

		if (person.contactPersonFirstName !== undefined && !s.trim(person.contactPersonFirstName)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field contactPersonFirstName is required', { method: 'updatePersonCouncil', field: 'contactPersonFirstName' });
		}

		if (person.contactPersonLastName !== undefined && !s.trim(person.contactPersonLastName)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field contactPersonLastName is required', { method: 'updatePersonCouncil', field: 'contactPersonLastName' });
		}

		return Councils.updatePersonCouncil(id, person, index);
	},
});
