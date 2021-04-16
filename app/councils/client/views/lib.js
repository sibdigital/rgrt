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

export function createCouncilData(date, description = '', councilType, invitedPersons, previousData, place) {
	const councilData = {
	};

	if (previousData) {
		councilData._id = previousData._id;
	}
	councilData.d = date;
	councilData.desc = description;
	councilData.type = councilType;
	councilData.place = place;
	// councilData.invitedUsers = invitedUsers;
	councilData.invitedPersons = invitedPersons;

	return councilData;
}

export function downloadCouncilParticipantsForm({ res, fileName }) {
	try {
		const url = window.URL.createObjectURL(new Blob([res]));
		console.log('downloadCouncilParticipant after url', url);
		const link = document.createElement('a');
		console.log('downloadCouncilParticipant after link', link);
		link.href = url;
		link.setAttribute('download', fileName);
		document.body.appendChild(link);
		console.log('downloadCouncilParticipant after append child');
		link.click();
		console.log('downloadCouncilParticipant after append child click');
	} catch (e) {
		console.error('downloadCouncilParticipantsForm :', e);
	}
}
