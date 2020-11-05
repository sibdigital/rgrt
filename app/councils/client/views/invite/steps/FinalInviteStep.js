import { Box, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useInvitePageContext } from '../InvitePageState';
import { useFormatDateAndTime } from '../../../../../../client/hooks/useFormatDateAndTime';

function FinalInviteStep() {
	const { councilState } = useInvitePageContext();
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();

	return <Box is='section' width='full' maxWidth='x480' margin='auto'>
		<Tile is='main' padding='x40'>
			<Box margin='x32'>
				<Box is='h1' fontScale='h1' marginBlockEnd='x32'>{t('Your_information_accepted')}</Box>
				<Box fontScale='h1'>{t('Wait_you')}</Box>
				<Box color='primary' fontScale='h1' marginBlockEnd='x24'>{formatDateAndTime(councilState.data.d)}</Box>
			</Box>
		</Tile>
	</Box>;
}

export default FinalInviteStep;
