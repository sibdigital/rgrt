import { UploadFiles } from '../../../models/server/raw';

export async function findUploadFiles({ query = {}, fields = {}, pagination: { offset, count, sort } }) {
	const cursor = await UploadFiles.find(query, {
		fields,
		sort: sort || { time: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const files = await cursor.toArray();

	return {
		files,
		count: files.length,
		offset,
		total,
	};
}

export async function findOneUploadFile(_id) {
	const cursor = await UploadFiles.findOne({ _id }, { fields: { workingGroupType: 1, name: 1 } });
	return cursor;
}
export async function findUploadFile(_id) {
	const cursor = await UploadFiles.findOne({ _id });
	return cursor;
}
