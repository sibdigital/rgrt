import { Tags } from '../../../models/server/raw';

export async function findTags({ query = {}, fields = {}, pagination: { offset, count, sort } }) {
	const cursor = await Tags.find(query, {
		fields,
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const tags = await cursor.toArray();

	return {
		tags,
		count: tags.length,
		offset,
		total,
	};
}
