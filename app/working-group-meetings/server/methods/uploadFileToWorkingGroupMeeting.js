// import { Meteor } from 'meteor/meteor';
//
// import { fileUploadToWorkingGroup } from '../../../ui';
//
// Meteor.methods({
// 	uploadFileToWorkingGroupMeeting(_id) {
// 		console.log('app/working-group-meetings/server/methods/uploadFileToWorkingGroupMeeting');
// 		if (!_id) {
// 			throw new Meteor.Error('error-the-field-is-required', 'The field id is required', { method: 'uploadFileToWorkingGroupMeeting', field: 'id' });
// 		}
//
// 		const $input = $(document.createElement('input'));
// 		$input.css('display', 'none');
// 		$input.attr({
// 			id: 'fileupload-input',
// 			type: 'file',
// 			multiple: 'multiple',
// 		});
//
// 		$(document.body).append($input);
//
// 		$input.one('change', function(e) {
// 			const filesToUpload = [...e.target.files].map((file) => {
// 				Object.defineProperty(file, 'type', {
// 					value: file.name,
// 				});
// 				return {
// 					file,
// 					name: file.name,
// 				};
// 			});
// 			fileUploadToWorkingGroup(filesToUpload, true, { _id });
// 			$input.remove();
// 		});
// 		$input.click();
//
// 		// Simple hack for iOS aka codegueira
// 		if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
// 			$input.click();
// 		}
// 	},
// });
