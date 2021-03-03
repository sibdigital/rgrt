import { Meteor } from 'meteor/meteor';

import { Agendas } from '../../../models';

Meteor.methods({
	deleteAgendaSection(agendaId, sectionId) {
		if (!agendaId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field agendaId is required', { method: 'deleteAgendaSection', field: 'agendaId' });
		}
		if (!sectionId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field sectionId is required', { method: 'deleteAgendaSection', field: 'sectionId' });
		}

		return Agendas.removeSection(agendaId, sectionId);
	},
});
