import { Box, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';

function FinalInviteStep() {
	const t = useTranslation();

	return <Box is='section' width='full' maxWidth='x480' margin='auto'>
		<Tile is='main' padding='x40'>
			<Box margin='x32'>
				<Box is='h1' fontScale='h1' marginBlockEnd='x32'>{t('Your_information_accepted')}</Box>
			</Box>
		</Tile>
	</Box>;
}

export default FinalInviteStep;
