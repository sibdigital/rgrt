import { Mongo } from 'meteor/mongo';

export const ChatMessage = new Mongo.Collection(null);

ChatMessage.setReactions = function(messageId, reactions) {
	return this.update({ _id: messageId }, { $set: { reactions } });
};

ChatMessage.unsetReactions = function(messageId) {
	return this.update({ _id: messageId }, { $unset: { reactions: 1 } });
};

ChatMessage.setTags = function(messageId, tags) {
	return this.update({ _id: messageId }, { $set: { tags } });
};

ChatMessage.unsetTags = function(messageId) {
	return this.update({ _id: messageId }, { $unset: { tags: 1 } });
};
