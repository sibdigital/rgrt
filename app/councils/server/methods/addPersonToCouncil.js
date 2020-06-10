import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Councils } from '../../../models';

Meteor.methods({
	addPersonToCouncil(id, person) {
		if (!id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'addPersonToCouncil', field: 'id' });
		}

		if (!person) {
			throw new Meteor.Error('error-the-field-is-required', 'The field person is required', { method: 'addPersonToCouncil', field: 'person' });
		}


		if (!s.trim(person.firstName)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field firstName is required', { method: 'addPersonToCouncil', field: 'firstName' });
		}

		if (!s.trim(person.lastName)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field lastName is required', { method: 'addPersonToCouncil', field: 'lastName' });
		}

		/* if (!s.trim(person.organization)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field organization is required', { method: 'addPersonToCouncil', field: 'organization' });
		}*/

		if (!s.trim(person.position)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field position is required', { method: 'addPersonToCouncil', field: 'position' });
		}

		if (!s.trim(person.phone)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field phone is required', { method: 'addPersonToCouncil', field: 'phone' });
		}

		if (!s.trim(person.email)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field email is required', { method: 'addPersonToCouncil', field: 'email' });
		}

		if (person.contactPersonFirstName !== undefined && !s.trim(person.contactPersonFirstName)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field contactPersonFirstName is required', { method: 'addPersonToCouncil', field: 'contactPersonFirstName' });
		}

		if (person.contactPersonLastName !== undefined && !s.trim(person.contactPersonLastName)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field contactPersonLastName is required', { method: 'addPersonToCouncil', field: 'contactPersonLastName' });
		}


		/* if (!s.trim(councilData.desc)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Description is required', { method: 'insertOrUpdateCouncil', field: 'Description' });
		}*/

		return Councils.addPersonToCouncil(id, person);
	},
});
