import { ObjectID } from 'bson';

import { Base } from './_Base';

class Agendas extends Base {
	constructor() {
		super('agendas');
	}

	create(agenda) {
		agenda.createdAt = new Date();
		const data = this.find({}, { sort: { numberCount: -1 }, limit: 1 }).fetch();
		agenda.numberCount = data[0].numberCount ? data[0].numberCount + 1 : 1;
		return this.insert(agenda);
	}

	addSection(_id, sectionData) {
		const sectionId = new ObjectID().toHexString();
		sectionData._id = sectionId;

		const data = this.findOne({ _id });
		data._updatedAt = new Date();

		data.sections = data.sections ? data.sections.concat(sectionData) : [sectionData];
		this.update({ _id }, { $set: { ...data } });
		return sectionId;
	}

	updateSection(agendaId, sectionId, sectionData) {
		const data = this.findOne({ _id: agendaId });

		if (data.sections) {
			data.sections = data.sections.map((section) => {
				if (section._id === sectionId) {
					return sectionData;
				}
				return section;
			});
		} else {
			data.sections = [sectionData];
		}
		data._updatedAt = new Date();
		return this.update({ _id: agendaId }, { $set: { ...data } });
	}

	addProposal(_id, proposal) {
		const proposalId = new ObjectID().toHexString();
		proposal._id = proposalId;

		const data = this.findOne({ _id });
		data._updatedAt = new Date();

		data.proposals = data.proposals ? data.proposals.concat(proposal) : [proposal];
		this.update({ _id }, { $set: { ...data } });
		return proposalId;
	}

	updateProposal(_id, proposal) {
		const data = this.findOne({ _id });

		if (data.proposals) {
			data.proposals = data.proposals.map((_proposal) => {
				if (_proposal._id === proposal._id) {
					return proposal;
				}
				return _proposal;
			});
		} else {
			data.proposal = [proposal];
		}
		data._updatedAt = new Date();
		return this.update({ _id }, { $set: { ...data } });
	}

	updateProposalStatus(_id, proposalId, status) {
		const data = this.findOne({ _id });

		if (data.proposals) {
			// console.log({ proposals: data.proposals, proposalId, status });
			data.proposals = data.proposals.map((proposal) => {
				if (proposal._id === proposalId) {
					proposal.status = status;
					proposal.added = true;
				}
				return proposal;
			});
			data._updatedAt = new Date();
			this.update({ _id }, { $set: { ...data } });
		}
	}

	updateAgenda(_id, data) {
		data._updatedAt = new Date();
		return this.update({ _id }, { $set: { ...data } });
	}

	updateAgendaSectionOrder(_id, sections) {
		const data = this.findOne({ _id });
		data._updatedAt = new Date();
		data.sections = sections;
		return this.update({ _id }, { $set: { ...data } });
	}

	removeSection(_id, sectionId) {
		const data = this.findOne({ _id });

		if (data.sections) {
			data.sections = data.sections.filter((section) => section._id !== sectionId);
			data._updatedAt = new Date();
			this.update({ _id }, { $set: { ...data } });
		}
	}

	removeProposal(_id, proposalId) {
		const data = this.findOne({ _id });

		if (data.proposals) {
			data.proposals = data.proposals.filter((proposal) => proposal._id !== proposalId);
			data._updatedAt = new Date();
			this.update({ _id }, { $set: { ...data } });
		}
	}
}

export default new Agendas();
