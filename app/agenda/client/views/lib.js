// Here previousData will define if it is an update or a new entry
export function validateAgenda(agenda) {
	const errors = [];

	if (!agenda.name) {
		errors.push('Name');
	}
	if (!agenda.number) {
		errors.push('Number');
	}

	return errors;
}

export function validateAgendaSection(sectionData) {
	const errors = [];

	if (!sectionData.issueConsideration) {
		errors.push('issueConsideration');
	}
	// if (!sectionData.date) {
	// 	errors.push('Date');
	// }
	if (!sectionData.speakers) {
		errors.push('Speakers');
	}

	return errors;
}

export function createAgenda({ number, name, previousData }) {
	const agendaData = {
	};

	if (previousData && previousData._id) {
		agendaData._id = previousData._id;
	}
	agendaData.number = number;
	agendaData.name = name;

	return agendaData;
}

export function createAgendaSection({ item, initiatedBy, issueConsideration, speakers, previousData, proposalId }) {
	const agendaData = {
	};

	if (previousData && previousData._id) {
		agendaData._id = previousData._id;
	}

	if (proposalId) {
		agendaData.proposalId = proposalId;
	}

	agendaData.item = item;
	agendaData.initiatedBy = initiatedBy;
	agendaData.issueConsideration = issueConsideration;
	// agendaData.date = date;
	agendaData.speakers = speakers;

	return agendaData;
}

export function validateProposalsForTheAgenda(proposalsData) {
	const errors = [];

	if (!proposalsData.initiatedBy) {
		errors.push('initiatedBy');
	}
	if (!proposalsData.issueConsideration) {
		errors.push('issueConsideration');
	}
	if (!proposalsData.date) {
		errors.push('date');
	}

	return errors;
}

export function createProposalsForTheAgenda(item, initiatedBy, issueConsideration, date, status, previousData = null) {
	const proposalsData = {
	};

	if (previousData && previousData._id) {
		proposalsData._id = previousData._id;
	}

	proposalsData.item = item;
	proposalsData.initiatedBy = initiatedBy;
	proposalsData.issueConsideration = issueConsideration;
	proposalsData.date = date;
	proposalsData.status = status;

	return proposalsData;
}
