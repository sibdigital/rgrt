import { WorkingGroups } from '../../../models/server/raw';

export async function findWorkingGroups({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await WorkingGroups.find(query, {
		sort: sort || { time: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const workingGroups = await cursor.toArray();

	return {
		workingGroups,
		count: workingGroups.length,
		offset,
		total,
	};
}

export async function findOneWorkingGroup(_id) {
	const cursor = await WorkingGroups.findOne({ _id }, { fields: { workingGroupType: 1, name: 1 } });
	return cursor;
}
export async function findWorkingGroup(_id) {
	const cursor = await WorkingGroups.findOne({ _id });
	return cursor;
}
