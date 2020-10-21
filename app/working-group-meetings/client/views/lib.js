// Here previousData will define if it is an update or a new entry
export function validate(workingGroupData) {
	const errors = [];

	if (!workingGroupData.d) {
		errors.push('Date');
	}

	if (!workingGroupData.desc) {
		errors.push('Description');
	}

	return errors;
}

export function createWorkingGroupMeetingData(d, desc, previousData) {
	const workingGroupMeetingData = {
	};

	if (previousData) {
		workingGroupMeetingData._id = previousData._id;
	}

	workingGroupMeetingData.d = d;
	workingGroupMeetingData.desc = desc;

	return workingGroupMeetingData;
}
