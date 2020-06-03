import { Box, Button, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { useSetting, useSettingDispatch } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';

function FinalInviteStep(inviteId) {
	const t = useTranslation();

	const handleClick = () => {

	};

	return <Box is='section' width='full' maxWidth='x480' margin='auto'>
		<Tile is='main' padding='x40'>
			<Box margin='x32'>
				<Box is='span' color='hint' fontScale='c2'>{t('Launched_successfully')}</Box>
				<Box is='h1' fontScale='h1' marginBlockEnd='x32'>{t('Your_workspace_is_ready')}</Box>
				<Box fontScale='micro'>{t('Your_server_link')}</Box>
				<Box color='primary' fontScale='s1' marginBlockEnd='x24'>{inviteId}</Box>
				<Button primary data-qa='go-to-workspace' onClick={handleClick}>{t('Go_to_your_workspace')}</Button>
			</Box>
		</Tile>
	</Box>;
}

export default FinalInviteStep;
