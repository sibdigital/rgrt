import { Box, Button, Tile } from '@rocket.chat/fuselage';
import React from 'react';

import { useSetting, useSettingDispatch } from '../../../../../../client/contexts/SettingsContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../../../client/contexts/RouterContext';
import {useInvitePageContext} from "/app/councils/client/views/invite/InvitePageState";
import moment from "moment";

function FinalInviteStep() {
	const { councilState } = useInvitePageContext();
	const t = useTranslation();

	return <Box is='section' width='full' maxWidth='x480' margin='auto'>
		<Tile is='main' padding='x40'>
			<Box margin='x32'>
				<Box is='h1' fontScale='h1' marginBlockEnd='x32'>{t('Your_information_accepted')}</Box>
				<Box fontScale='micro'>{t('Wait_you')}</Box>
				<Box color='primary' fontScale='s1' marginBlockEnd='x24'>{moment(councilState.data.d).format(moment.localeData().longDateFormat('LLL'))}</Box>
			</Box>
		</Tile>
	</Box>;
}

export default FinalInviteStep;
