import { Box, Button, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { useSetting, useSettingDispatch } from '../../../../../../client/contexts/SettingsContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../../../client/contexts/RouterContext';

function ErrorInviteStep() {
	const t = useTranslation();
	const councilId = useRouteParameter('id');

	return <Box is='section' width='full' maxWidth='x480' margin='auto'>
		<Tile is='main' padding='x40'>
			<Box margin='x32'>
				<Box is='span' color='hint' fontScale='c2'>{t('Council_invite_error', { id: councilId })}</Box>

			</Box>
		</Tile>
	</Box>;
}

export default ErrorInviteStep;
