import { setUsername } from './setUsername';
import { setRealName } from './setRealName';
import { setSurname } from './setSurname';
import { setPatronymic } from './setPatronymic';
import { Messages, Rooms, Subscriptions, LivechatDepartmentAgents, Users } from '../../../models/server';
import { FileUpload } from '../../../file-upload/server';
import { updateGroupDMsName } from './updateGroupDMsName';

/**
 *
 * @param {string} userId user performing the action
 * @param {object} changes changes to the user
 */
export function saveUserIdentity(userId, { _id, name: rawName, username: rawUsername, surname: rawSurname, patronymic: rawPatronymc }) {
	if (!_id) {
		return false;
	}

	const name = String(rawName).trim();
	const username = String(rawUsername).trim();
	const surname = String(rawSurname).trim();
	const patronymic = String(rawPatronymc).trim();

	const user = Users.findOneById(_id);

	const previousUsername = user.username;
	const previousName = user.name;
	const previousSurname = user.surname;
	const previousPatronymic = user.patronymic;
	const nameChanged = previousName !== name;
	const usernameChanged = previousUsername !== username;
	const surnameChanged = previousSurname !== surname;
	const patronymicChanged = previousPatronymic !== patronymic;

	if (typeof rawUsername !== 'undefined' && usernameChanged) {
		if (!setUsername(_id, username, user)) {
			return false;
		}
		user.username = username;
	}

	if (typeof rawName !== 'undefined' && nameChanged) {
		if (!setRealName(_id, name, user)) {
			return false;
		}
	}

	if (typeof rawSurname !== 'undefined' && surnameChanged) {
		if (!setSurname(_id, surname, user)) {
			return false;
		}
	}

	// if (typeof rawPatronymc !== 'undefined' && patronymicChanged) {
	// 	if (!setPatronymic(_id, patronymic, user)) {
	// 		return false;
	// 	}
	// }

	// if coming from old username, update all references
	if (previousUsername && usernameChanged) {
		if (typeof rawUsername !== 'undefined') {
			Messages.updateAllUsernamesByUserId(user._id, username);
			Messages.updateUsernameOfEditByUserId(user._id, username);
			Messages.findByMention(previousUsername).forEach(function(msg) {
				const updatedMsg = msg.msg.replace(new RegExp(`@${ previousUsername }`, 'ig'), `@${ username }`);
				return Messages.updateUsernameAndMessageOfMentionByIdAndOldUsername(msg._id, previousUsername, username, updatedMsg);
			});
			Rooms.replaceUsername(previousUsername, username);
			Rooms.replaceMutedUsername(previousUsername, username);
			Rooms.replaceUsernameOfUserByUserId(user._id, username);
			Subscriptions.setUserUsernameByUserId(user._id, username);

			LivechatDepartmentAgents.replaceUsernameOfAgentByUserId(user._id, username);

			const fileStore = FileUpload.getStore('Avatars');
			const file = fileStore.model.findOneByName(previousUsername);
			if (file) {
				fileStore.model.updateFileNameById(file._id, username);
			}
		}

		// update name and fname of 1-on-1 direct messages
		Subscriptions.updateDirectNameAndFnameByName(previousUsername, rawUsername && username, rawName && name);

		// update name and fname of group direct messages
		updateGroupDMsName(user);
	}

	return true;
}
