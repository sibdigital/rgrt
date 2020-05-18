import { CachedChatRoom } from './CachedChatRoom';

export const ChatRoom = CachedChatRoom.collection;

ChatRoom.setReactionsInLastMessage = function(roomId, lastMessage) {
	return this.update({ _id: roomId }, { $set: { lastMessage } });
};

ChatRoom.unsetReactionsInLastMessage = function(roomId) {
	return this.update({ _id: roomId }, { $unset: { lastMessage: { reactions: 1 } } });
};

ChatRoom.setTagsInLastMessage = function(roomId, lastMessage) {
	return this.update({ _id: roomId }, { $set: { lastMessage } });
};

ChatRoom.unsetTagsInLastMessage = function(roomId) {
	return this.update({ _id: roomId }, { $unset: { lastMessage: { tags: 1 } } });
};
