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

		if (!workingGroupRequestAnswerData.document) {
			throw new Meteor.Error('error-the-field-is-required', 'The field document is required', { method: 'addWorkingGroupRequestAnswer', field: 'document' });
		}

		if (!s.trim(workingGroupRequestAnswerData.phone)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field phone is required', { method: 'addWorkingGroupRequestAnswer', field: 'phone' });
		}

		if (!s.trim(workingGroupRequestAnswerData.email)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field email is required', { method: 'addWorkingGroupRequestAnswer', field: 'email' });
		}

		return WorkingGroupsRequests.addAnswerToRequest(_id, mailId, workingGroupRequestAnswerData);
	},
});
