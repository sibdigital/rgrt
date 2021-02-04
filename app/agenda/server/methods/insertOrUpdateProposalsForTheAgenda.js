import { Meteor } from 'meteor/meteor';

import { Agendas } from '../../../models';

Meteor.methods({
	insertOrUpdateProposalsForTheAgenda(agendaId, proposal) {
		if (!proposal.issueConsideration) {
			throw new Meteor.Error('error-the-field-is-required', 'The field issueConsideration is required', { method: 'insertOrUpdateProposalsForTheAgenda', field: 'issueConsideration' });
		}
		if (!proposal.date) {
			throw new Meteor.Error('error-the-field-is-required', 'The field date is required', { method: 'insertOrUpdateProposalsForTheAgenda', field: 'date' });
		}
		if (!proposal.initiatedBy) {
			throw new Meteor.Error('error-the-field-is-required', 'The field initiatedBy is required', { method: 'insertOrUpdateProposalsForTheAgenda', field: 'initiatedBy' });
		}
		if (!proposal.status) {
			throw new Meteor.Error('error-the-field-is-required', 'The field status is required', { method: 'insertOrUpdateProposalsForTheAgenda', field: 'status' });
		}

		const proposalForTheAgenda = {
			item: proposal.item ?? '',
			ts: new Date(),
			issueConsideration: proposal.issueConsideration,
			date: proposal.date,
			initiatedBy: proposal.initiatedBy,
			status: proposal.status,
		};

		if (!proposal._id) {
			const _id = Agendas.addProposal(agendaId, proposalForTheAgenda);
			return { id: _id };
		}

		proposalForTheAgenda._id = proposal._id;
		return Agendas.updateProposal(agendaId, proposalForTheAgenda);
	},
});
