import React from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';

export function GoBackButton({
	onClick = null,
	className = 'go-back-button',
	...props
}) {
	const goBack = () => {
		window.history.back();
	};

	return <Button className={className} onClick={onClick ?? goBack} {...props}>
		<Icon name='back'/>
	</Button>;
}
