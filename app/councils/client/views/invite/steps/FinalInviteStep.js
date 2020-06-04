import { Box, Button, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { useSetting, useSettingDispatch } from '../../../../../../client/contexts/SettingsContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../../../client/contexts/RouterContext';

function FinalInviteStep() {
	const t = useTranslation();
	const councilId = useRouteParameter('id');

	return <Box is='section' width='full' maxWidth='x480' margin='auto'>
		<Tile is='main' padding='x40'>
			<Box margin='x32'>
				<Box is='span' color='hint' fontScale='c2'>{t('Launched_successfully')}</Box>
				<Box is='h1' fontScale='h1' marginBlockEnd='x32'>{t('Your_workspace_is_ready')}</Box>
				<Box fontScale='micro'>{t('Your_server_link')}</Box>
				<Box color='primary' fontScale='s1' marginBlockEnd='x24'>{councilId}</Box>
			</Box>
		</Tile>
	</Box>;
}

export default FinalInviteStep;
