/*
	input: @value = string
		   @prevValue = string

	method retrieves the result of matching a string against a regular expression.

	output: null if string not match
			array of matches else
*/
export const checkNumberWithDot = (value, prevValue = '') => {
	if (!value || typeof value !== 'string' || value.length < 1 || value[0] === '.') {
		return null;
	}
	let str = value;
	if (value[value.length - 1] === '.') {
		str = value.slice(0, value.length - 1);
	}

	return str.match('^\\d+(\\.\\d+)*$');
};
