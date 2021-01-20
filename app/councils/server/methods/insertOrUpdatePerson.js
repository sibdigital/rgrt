import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Persons } from '../../../models';

Meteor.methods({
	insertOrUpdatePerson(person) {
		if (!person) {
			throw new Meteor.Error('error-the-field-is-required', 'The field person is required', { method: 'insertOrUpdatePerson', field: 'person' });
		}

		if (!s.trim(person.name)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field name is required', { method: 'insertOrUpdatePerson', field: 'name' });
		}

		if (!s.trim(person.surname)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field surname is required', { method: 'insertOrUpdatePerson', field: 'surname' });
		}

		if (!s.trim(person.patronymic)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field patronymic is required', { method: 'insertOrUpdatePerson', field: 'patronymic' });
		}

		if (!s.trim(person.phone)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field phone is required', { method: 'insertOrUpdatePerson', field: 'phone' });
        }
        
        // if (!s.trim(person.organization)) {
		// 	throw new Meteor.Error('error-the-field-is-required', 'The field organization is required', { method: 'insertOrUpdatePerson', field: 'organization' });
        // }
        
        // if (!s.trim(person.position)) {
		// 	throw new Meteor.Error('error-the-field-is-required', 'The field position is required', { method: 'insertOrUpdatePerson', field: 'position' });
		// }

		if (!s.trim(person.email)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field email is required', { method: 'insertOrUpdatePerson', field: 'email' });
        }
        
		// if (!s.trim(person.workingGroup)) {
		// 	throw new Meteor.Error('error-the-field-is-required', 'The field workingGroup is required', { method: 'insertOrUpdatePerson', field: 'workingGroup' });
		// }

		if (!person._id) {

            const createPerson = {
                surname: person.surname,
                name: person.name,
                patronymic: person.patronymic,
                phone: person.phone,
                // organization: person.organization,
                // position: person.position,
                email: person.email,
                // workingGroup: person.workingGroup,
                ts: new Date(),
			};

			const _id = Persons.insert(createPerson);

			return _id;
		}

		return Persons.update(person._id, person);
	},
});
