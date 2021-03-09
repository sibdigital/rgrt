import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';

export function Pager({ disabled, onBackClick, onBackClickText = null, isContinueEnabled = true, continueButtonLabel = null }) {
	const t = useTranslation();

	return <ButtonGroup align='end'>
		{onBackClick ? <Button type='button' disabled={disabled} onClick={onBackClick} data-qa='previous-step'>
			{ onBackClickText ?? t('Back')}
		</Button> : null}
		<Button type='submit' primary disabled={!isContinueEnabled || disabled} data-qa='next-step'>
			{continueButtonLabel ?? t('Continue')}
		</Button>
	</ButtonGroup>;
}
