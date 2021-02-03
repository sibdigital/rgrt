// Here previousData will define if it is an update or a new entry
export function validate(councilData) {
	const errors = [];

	if (!councilData.d) {
		errors.push('Date');
	}

	if (!councilData.desc) {
		errors.push('Description');
	}

	return errors;
}

export function createCouncilData(date, description = '', councilType, invitedPersons, previousData) {
	const councilData = {
	};

	if (previousData) {
		councilData._id = previousData._id;
	}
	councilData.d = date;
	councilData.desc = description;
	councilData.type = councilType;
	// councilData.invitedUsers = invitedUsers;
	councilData.invitedPersons = invitedPersons;

	return councilData;
}

export function downloadCouncilParticipantsForm({ res, fileName }) {
	try {
		// const res = await downloadCouncilParticipantsMethod({ _id, dateString: formatDateAndTime(data.d) });
		const url = window.URL.createObjectURL(new Blob([res]));
		const link = document.createElement('a');
		link.href = url;
		// const fileName = [t('Council_from') + ' ' + moment(new Date()).format('DD MMMM YYYY') + '.docx'].join('');
		link.setAttribute('download', fileName);
		document.body.appendChild(link);
		link.click();
	} catch (e) {
		console.error('downloadCouncilParticipantsForm :', e);
		console.log('downloadCouncilParticipantsForm :', e);
	}
};