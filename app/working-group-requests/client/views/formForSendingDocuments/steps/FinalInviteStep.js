import { Box, Tile, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useInvitePageContext } from '../InvitePageState';
import { useFormatDateAndTime } from '../../../../../../client/hooks/useFormatDateAndTime';

function FinalInviteStep({ fileDownloadInfo = null }) {
	const { workingGroupRequestState } = useInvitePageContext();
	const formatDateAndTime = useFormatDateAndTime();
	const t = useTranslation();
	console.log({ fileDownloadInfo, workingGroupRequestState });

	return <Box is='section' width='full' maxWidth='x480' margin='auto'>
		<Tile is='main' padding='x40'>
			<Box margin='x32'>
				<Box is='h1' fontScale='h1' marginBlockEnd='x32'>
					<Icon color='success' name='checkmark-circled' size={20} mie='x16'/>
					{t('Working_group_request_your_information_accepted',
						workingGroupRequestState?.data?.number ? ['№', workingGroupRequestState.data.number].join('') : '',
						formatDateAndTime(workingGroupRequestState?.data?.date ?? new Date()),
						fileDownloadInfo?.workingGroupRequestAnswer?.answerType === 'protocol' && fileDownloadInfo?.workingGroupRequestAnswer?.protocol?.title ? ['по ', fileDownloadInfo.workingGroupRequestAnswer.protocol.title].join('') : '',
					)}
					{fileDownloadInfo?.workingGroupRequestAnswer?.answerType === 'mail' && [' По письму ', fileDownloadInfo?.workingGroupRequestAnswer?.mailAnswer ?? ''].join('')}
				</Box>
			</Box>
		</Tile>
	</Box>;
}

export default FinalInviteStep;
