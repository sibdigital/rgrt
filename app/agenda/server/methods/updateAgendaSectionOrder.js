import { Meteor } from 'meteor/meteor';

import { Agendas } from '../../../models';

Meteor.methods({
	updateAgendaSectionOrder(agendaId, sections) {
		if (!agendaId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field agendaId is required', { method: 'updateAgendaSectionOrder', field: 'agendaId' });
		}
		if (!sections) {
			throw new Meteor.Error('error-the-field-is-required', 'The field sections is required', { method: 'updateAgendaSectionOrder', field: 'sections' });
		}

		return Agendas.updateAgendaSectionOrder(agendaId, sections);
	},
});
