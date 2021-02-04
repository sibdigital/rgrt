import { Meteor } from 'meteor/meteor';

import { Agendas } from '../../../models';

Meteor.methods({
	updateProposalStatus(agendaId, proposalId, status) {
		if (!agendaId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field agendaId is required', { method: 'updateProposalStatus', field: 'agendaId' });
		}
		if (!proposalId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field proposalId is required', { method: 'updateProposalStatus', field: 'proposalId' });
		}
		if (!status) {
			throw new Meteor.Error('error-the-field-is-required', 'The field status is required', { method: 'updateProposalStatus', field: 'status' });
		}

		return Agendas.updateProposalStatus(agendaId, proposalId, status);
	},
});
