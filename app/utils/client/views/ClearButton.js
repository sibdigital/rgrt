import React from 'react';
import ReactTooltip from 'react-tooltip';
import { Button, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';

export function ClearButton({
	onClick = () => {},
	tooltipText = '',
	iconName = 'refresh',
	...props
}) {
	const t = useTranslation();

	return <Button
		{...props}
		onClick={onClick}
		backgroundColor='transparent'
		borderColor='transparent'
		danger
		data-for='clearTooltip'
		data-tip={ tooltipText === '' ? t('Clear') : tooltipText }
		style={{ whiteSpace: 'normal' }}
	>
		<ReactTooltip id='clearTooltip' effect='solid' place='top'/>
		<Icon size={16} name={iconName}/>
	</Button>;
}
