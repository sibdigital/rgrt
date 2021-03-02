import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Agendas } from '../../../models';

Meteor.methods({
	insertOrUpdateAgendaSection(agendaId, sectionData) {
		if (!hasPermission(this.userId, 'manage-councils')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!sectionData.issueConsideration) {
			throw new Meteor.Error('error-the-field-is-required', 'The field issueConsideration is required', { method: 'insertOrUpdateAgendaSection', field: 'issueConsideration' });
		}
		// if (!sectionData.date) {
		// 	throw new Meteor.Error('error-the-field-is-required', 'The field date is required', { method: 'insertOrUpdateAgendaSection', field: 'date' });
		// }
		if (!sectionData.speakers) {
			throw new Meteor.Error('error-the-field-is-required', 'The field speakers is required', { method: 'insertOrUpdateAgendaSection', field: 'speakers' });
		}

		const agendaSection = {
			item: sectionData.item,
			initiatedBy: sectionData.initiatedBy,
			ts: new Date(),
			issueConsideration: sectionData.issueConsideration ?? '',
			// date: sectionData.date ?? '',
			speakers: sectionData.speakers ?? [],
		};
		console.log({ sectionData });

		sectionData.proposalId && Object.assign(agendaSection, { proposalId: sectionData.proposalId });
		console.log({ agendaSection });

		if (!sectionData._id) {
			const _id = Agendas.addSection(agendaId, agendaSection);
			return { _id, ts: agendaSection.ts };
		}

		agendaSection._id = sectionData._id;
		return Agendas.updateSection(agendaId, sectionData._id, agendaSection);
	},
});
