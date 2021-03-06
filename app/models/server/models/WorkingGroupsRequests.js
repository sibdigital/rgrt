import { ObjectID } from 'bson';

import { Base } from './_Base';

class WorkingGroupsRequests extends Base {
	constructor() {
		super('working-groups-requests');
	}

	// INSERT
	create(data) {
		data.createdAt = new Date();
		return this.insert(data);
	}

	createWorkingGroupRequestMail(workingGroupRequestId, mailData) {
		const _id = new ObjectID().toHexString();
		mailData._id = _id;

		const data = this.findOne({ _id: workingGroupRequestId });

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

	addAnswerToRequest(workingGroupRequestId, _mailId, answerData) {
		const _id = new ObjectID().toHexString();
		answerData._id = _id;

		const data = this.findOne({ _id: workingGroupRequestId });
		data._updatedAt = new Date();

		if (data.answers) {
			data.answers = [...data.answers, answerData];
		} else {
			data.answers = [answerData];
		}

		this.update({ _id: workingGroupRequestId }, { $set: { ...data } });
		return { answerId: _id, mailId: _id };
	}

	addWorkingGroupRequestAnswerFile(workingGroupRequestId, answerId, fileData) {
		const data = this.findOne({ _id: workingGroupRequestId });
		// const indexMail = data.mails ? data.mails.findIndex((mail) => mail._id === mailId) : -1;
		// if (indexMail < 0) {
		// 	return;
		// }

		const indexAnswer = data.answers ? data.answers.findIndex((answer) => answer._id === answerId) : -1;
		if (indexAnswer < 0) {
			return;
		}

		data._updatedAt = new Date();
		if (data.answers[indexAnswer].documents) {
			data.answers[indexAnswer].documents.push(fileData);
		} else {
			data.answers[indexAnswer].documents = [fileData];
		}
		return this.update({ _id: workingGroupRequestId }, { $set: { ...data } });
	}

	// UPDATE
	updateWorkingGroupRequest(_id, data) {
		data._updatedAt = new Date();
		return this.update({ _id }, { $set: { ...data } });
	}

	updateWorkingGroupRequestMail(workingGroupRequestId, updateMailData) {
		const data = this.findOne({ _id: workingGroupRequestId });
		if (data.mails) {
			const index = data.mails.findIndex((mail) => mail._id === updateMailData._id);
			if (index < 0) {
				return;
			}
			data.mails[index] = updateMailData;
			data._updatedAt = new Date();
			return this.update({ _id: workingGroupRequestId }, { $set: { ...data } });
		}
	}

	readAnswer(_id, answerId) {
		const data = this.findOne({ _id });
		// const indexMail = data.mails ? data.mails.findIndex((mail) => mail._id === mailId) : -1;
		// if (indexMail < 0) {
		// 	return;
		// }

		const indexAnswer = data.answers ? data.answers.findIndex((answer) => answer._id === answerId) : -1;
		if (indexAnswer < 0) {
			return;
		}

		data._updatedAt = new Date();
		data.answers[indexAnswer].unread = false;
		return this.update({ _id }, { $set: { ...data } });
	}

	// REMOVE
	removeById(_id) {
		return this.remove({ _id });
	}
}

export default new WorkingGroupsRequests();
