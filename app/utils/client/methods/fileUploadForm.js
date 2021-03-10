/*
	input: @value = string
		   @prevValue = string

	method retrieves the result of matching a string against a regular expression.

	output: null if string not match
			array of matches else
*/
import { settings } from '../../../settings/client';
import { mime } from '../../index';

export const fileUploadForm = (staticFileIndex = 0) => {
	// e.preventDefault();
	let result = {};
	console.log('fileUpload');
	if (!settings.get('FileUpload_Enabled')) {
		console.log('!fileUpload_enabled');
		return null;
	}
	const $input = $(document.createElement('input'));
	let fileIndex = staticFileIndex;
	$input.css('display', 'none');
	$input.attr({
		id: 'fileupload-input',
		type: 'file',
		multiple: 'multiple',
	});

	$(document.body).append($input);

	$input.one('change', function(e) {
		const filesToUpload = [...e.target.files].map((file) => {
			Object.defineProperty(file, 'type', {
				value: mime.lookup(file.name),
			});
			fileIndex++;
			return {
				file,
				name: file.name,
				id: fileIndex,
			};
		});
		// setStaticFileIndex(fileIndex);
		// setAttachedFile(attachedFile.concat(filesToUpload));
		$input.remove();
		result = { count: filesToUpload.length, files: filesToUpload };
		$input.attr({ result });
		return result;
	});
	return $input.click().after();

	if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
		$input.click();
	}
};
