import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Agendas } from '../../../models';

Meteor.methods({
	insertOrUpdateAgenda(agendaData) {
		if (!hasPermission(this.userId, 'manage-councils')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!agendaData.name) {
			throw new Meteor.Error('error-the-field-is-required', 'The field name is required', { method: 'insertOrUpdateAgenda', field: 'name' });
		}
		if (!agendaData.number) {
			throw new Meteor.Error('error-the-field-is-required', 'The field number is required', { method: 'insertOrUpdateAgenda', field: 'number' });
		}

		if (!agendaData._id) {
			const createAgenda = {
				ts: new Date(),
				name: agendaData.name,
				number: agendaData.number,
				councilId: agendaData.councilId ?? '',
			};

			const _id = Agendas.create(createAgenda);

			return { _id, ts: createAgenda.ts };
		}

		return Agendas.updateAgenda(agendaData._id, agendaData);
	},
});
