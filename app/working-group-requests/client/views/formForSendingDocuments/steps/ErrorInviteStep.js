import { Box, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';

function ErrorInviteStep() {
	const t = useTranslation();

	return <Box is='section' width='full' maxWidth='x480' margin='auto'>
		<Tile is='main' padding='x40'>
			<Box margin='x32'>
				<Box is='span' color='hint' fontScale='c2'>{t('Working_group_request_invite_error')}</Box>
			</Box>
		</Tile>
	</Box>;
}

export default ErrorInviteStep;
