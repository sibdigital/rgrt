import { Tags } from '../../../models/server/raw';

export async function findTags({ query = {}, pagination: { offset, count, sort } }) {
	const cursor = await Tags.find(query, {
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
