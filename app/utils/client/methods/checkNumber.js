// format = 2,2,3
export const checkNumberWithDot = (value, prevValue) => {
	if (!value || value.length < 1 || value[0] === '.') {
		return null;
	}
	let str = value;
	if (value[value.length - 1] === '.') {
		str = value.slice(0, value.length - 1);
	}

	return str.match('^\\d+(\\.\\d+)*$');
};
