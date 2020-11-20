import { Base } from './_Base';
import { ObjectID } from 'bson';

class WorkingGroupsRequests extends Base {
	constructor() {
		super('working-groups-requests');
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}

	createWorkingGroupRequestMail(workingGroupRequestId, mailData) {
		const _id = new ObjectID().toHexString();
		mailData._id = _id;

		const data = this.findOne({ _id: workingGroupRequestId });
		console.log(workingGroupRequestId);
		console.log(data);

		if (data.mails) {
			let internalNum = 0;
			data.mails.forEach((mail) => {
				if (mail.inum > internalNum) {
					internalNum = mail.inum;
				}
			});
			internalNum++;
			mailData.inum = internalNum;
			data.mails = [...data.mails, mailData];
		} else {
			mailData.inum = 1;
			data.mails = [mailData];
		}

		data._updatedAt = new Date();
		this.update({ _id: workingGroupRequestId }, { $set: { ...data } });

		return _id;
	}

	// addAnswerToRequest(_id, mailIndex, answer) {
	// 	const data = this.findOne({ _id });
	// 	if (mailIndex < 0 && mailIndex >= data.mails.length) {
	// 		return;
	// 	}
	// 	data._updatedAt = new Date();
	// 	data.mails[mailIndex].answers = data.mails[mailIndex].answers ? [...data.mails[mailIndex].answers, answer] : [answer];
	// 	return this.update({ _id }, { $set: { ...data } });
	// }

	addAnswerToRequest(workingGroupRequestId, mailId, answerData) {
		const _id = new ObjectID().toHexString();
		answerData._id = _id;

		const data = this.findOne({ _id: workingGroupRequestId });

		if (data.mails) {
			data._updatedAt = new Date();

			data.mails.forEach((mail) => {
				if (mail._id === mailId) {
					if (mail.answers) {
						let internalNum = 0;
						mail.answers.forEach((answer) => {
							if (answer.inum > internalNum) {
								internalNum = answer.inum;
							}
						});
						internalNum++;
						answerData.inum = internalNum;
						mail.answers = [...mail.answers, answerData];
					} else {
						answerData.inum = 1;
						mail.answers = [answerData];
					}
				}
			});

			this.update({ _id: workingGroupRequestId }, { $set: { ...data } });
		}

		return _id;
	}

	// UPDATE
	updateWorkingGroupRequest(_id, data) {
		data._updatedAt = new Date();
		return this.update({ _id }, { $set: { ...data } });
	}

	updateWorkingGroupRequestMail(_id, data) {

	}

	readAnswer(_id, mailId, answerId) {
		const data = this.findOne({ _id });
		const indexMail = data.mails ? data.mails.findIndex((mail) => mail._id === mailId) : -1;
		if (indexMail < 0) {
			return;
		}

		const indexAnswer = data.mails[indexMail].answers ? data.mails[indexMail].answers.findIndex((answer) => answer._id === answerId) : -1;
		if (indexAnswer < 0) {
			return;
		}

		data._updatedAt = new Date();
		data.mails[indexMail].answers[indexAnswer].unread = false;
		return this.update({ _id }, { $set: { ...data } });
	}

	// REMOVE
	removeById(_id) {
		return this.remove({ _id });
	}
}

export default new WorkingGroupsRequests();
