import { APIClient } from '../../../utils';

export const uploadPersonAvatar = async ({file}) => {
	const uploadedFile = await uploadFile({
		description: '',
		file: { file },
		// ts: file.ts,
	});

	return uploadedFile;
};

export const uploadFile = async ({ 
    description,
    file, 
    // ts, 
}) => {
	const data = new FormData();
	description	&& data.append('description', description);
	data.append('file', file.file);
	data.append('ts', new Date());

	const { xhr, promise } = APIClient.upload(`v1/persons.uploadAvatar`, {}, data, {});

	try {
		await promise;
		console.log(promise)
		return promise;
		//return { id: promise.responseJSON._id, url: promise.responseJSON.url, description };
	} catch (error) {
		console.log(error);
	}
};