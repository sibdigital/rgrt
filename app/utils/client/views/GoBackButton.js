import React from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';

export function GoBackButton() {
	const goBack = () => {
		window.history.back();
	};

	return <Button className='go-back-button' onClick={goBack}>
		<Icon name='back'/>
	</Button>;
}
