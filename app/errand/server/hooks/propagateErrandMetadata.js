import { callbacks } from '../../../callbacks/server';
import { Messages, Rooms } from '../../../models/server';
import { deleteRoom } from '../../../lib/server';

/**
 * We need to propagate the writing of new message in a errand to the linking
 * system message
 */
callbacks.add('afterSaveMessage', function(message, { _id, prid } = {}) {
	if (prid) {
		Messages.refreshErrandMetadata({ rid: _id }, message);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateErrandMetadata');

callbacks.add('afterDeleteMessage', function(message, { _id, prid } = {}) {
	if (prid) {
		Messages.refreshErrandMetadata({ rid: _id }, message);
	}
	if (message.drid) {
		deleteRoom(message.drid);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateErrandMetadata');

callbacks.add('afterDeleteRoom', (rid) => Rooms.find({ prid: rid }, { fields: { _id: 1 } }).forEach(({ _id }) => deleteRoom(_id)), 'DeleteErrandChain');

// TODO errands define new fields
callbacks.add('afterRoomNameChange', ({ rid, name, oldName }) => Rooms.update({ prid: rid, ...oldName && { topic: oldName } }, { $set: { topic: name } }, { multi: true }), 'updateTopicErrand');

callbacks.add('afterDeleteRoom', (drid) => Messages.update({ drid }, {
	$unset: {
		dcount: 1,
		dlm: 1,
		drid: 1,
	},
}), 'CleanErrandMessage');
