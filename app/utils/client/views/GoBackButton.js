import React from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';

export function GoBackButton({ onClick = null, ...props }) {
	const goBack = () => {
		window.history.back();
	};

	return <Button className='go-back-button' onClick={onClick ?? goBack} {...props}>
		<Icon name='back'/>
	</Button>;
}
