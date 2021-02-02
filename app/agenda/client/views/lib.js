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
	if (!sectionData.date) {
		errors.push('Date');
	}
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

export function createAgendaSection({ issueConsideration, date, speakers, previousData }) {
	const agendaData = {
	};

	if (previousData && previousData._id) {
		agendaData._id = previousData._id;
	}

	agendaData.issueConsideration = issueConsideration;
	agendaData.date = date;
	agendaData.speakers = speakers;

	return agendaData;
}
