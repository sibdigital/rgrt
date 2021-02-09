import { API } from '../api';

API.helperMethods.set('deleteDefaultFieldsToExclude', function _deleteDefaultFieldsToExclude(fields) {
	const nonSelectableFields = Object.keys(API.v1.defaultFieldsToExclude);

	Object.keys(fields).forEach((k) => {
		if (nonSelectableFields.includes(k) || nonSelectableFields.includes(k.split(API.v1.fieldSeparator)[0])) {
			delete fields[k];
		}
	});
	return fields;
});
