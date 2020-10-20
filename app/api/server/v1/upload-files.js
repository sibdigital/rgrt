import { API } from '../api';
import { findUploadFiles, findOneUploadFile, findUploadFile } from '../lib/upload-files';

API.v1.addRoute('upload-files.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findUploadFiles({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('upload-files.getOne', { authRequired: false }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findOneUploadFile(query._id)));
	},
});

API.v1.addRoute('upload-files.findOne', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		return API.v1.success(Promise.await(findUploadFile(query._id)));
	},
});
