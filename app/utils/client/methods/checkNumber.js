const validate = (value) => {
	// console.log({ value, valid: !(!value || typeof value !== 'string') });
	return !(!value || typeof value !== 'string');
};

/*
	input: @value = string
		   @prevValue = string

	method retrieves the result of matching a string against a regular expression.

	output: null if string not match
			array of matches else
*/

export const checkNumberWithDot = (value) => {
	if (value === '') {
		return value;
	}

	if (!validate(value) || value === '.') {
		return null;
	}

	let str = value;
	if (value[value.length - 1] === '.') {
		str = value.slice(0, value.length - 1);
	}

	return str.match('^\\d+(\\.\\d+)*$');
};


/*
	input: @value = string

	method retrieves the result of matching a string against a regular expression.

	output: null if string not match
			array of matches else
*/

export const checkRomanNumber = (value) => {
	if (value === '') {
		return value;
	}

	if (!validate(value)) {
		return null;
	}

	return value.match('^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$');
};
