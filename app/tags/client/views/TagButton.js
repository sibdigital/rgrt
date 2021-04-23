import { Button, Icon } from '@rocket.chat/fuselage';
import { Tooltip } from '@material-ui/core';
import React from 'react';

function TagButton({ tag }) {
	const tagName = tag?.name ?? '';

	return <Tooltip title={tagName} arrow placement='top'>
		<Button small zIndex='10'>
			<Icon zIndex='11' name='star'/>
		</Button>
	</Tooltip>;
}

export default TagButton;
