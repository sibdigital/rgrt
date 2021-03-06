import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { WorkingGroupsRequests } from '../../../models/server';

Meteor.methods({
	addWorkingGroupRequestAnswer(_id, mailId, workingGroupRequestAnswerData) {
		if (!_id) {
			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'addWorkingGroupRequestAnswer', field: 'id' });
		}

		if (!workingGroupRequestAnswerData) {
			throw new Meteor.Error('error-the-field-is-required', 'The field workingGroupRequestAnswerData is required', { method: 'addWorkingGroupRequestAnswer', field: 'workingGroupRequestAnswerData' });
		}

		if (!s.trim(workingGroupRequestAnswerData.sender.phone)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field phone is required', { method: 'addWorkingGroupRequestAnswer', field: 'phone' });
		}

		if (!s.trim(workingGroupRequestAnswerData.sender.email)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field email is required', { method: 'addWorkingGroupRequestAnswer', field: 'email' });
		}

		return WorkingGroupsRequests.addAnswerToRequest(_id, mailId, workingGroupRequestAnswerData);
	},
});
