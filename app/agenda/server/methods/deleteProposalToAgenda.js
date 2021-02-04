import { Meteor } from 'meteor/meteor';

import { Agendas } from '../../../models';

Meteor.methods({
	deleteProposalToAgenda(agendaId, proposalId) {
		if (!agendaId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field agendaId is required', { method: 'deleteProposalToAgenda', field: 'agendaId' });
		}
		if (!proposalId) {
			throw new Meteor.Error('error-the-field-is-required', 'The field proposalId is required', { method: 'deleteProposalToAgenda', field: 'proposalId' });
		}

		return Agendas.removeProposal(agendaId, proposalId);
	},
});
