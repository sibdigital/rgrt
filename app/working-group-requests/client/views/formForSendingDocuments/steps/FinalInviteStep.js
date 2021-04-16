import { Box, Tile, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useFormatDate } from '../../../../../../client/hooks/useFormatDate';
import { useInvitePageContext } from '../InvitePageState';
import { AnswerTypes } from '../../AnswerForm';

function FinalInviteStep({ fileDownloadInfo = null }) {
	const { workingGroupRequestState } = useInvitePageContext();
	const formatDate = useFormatDate();
	const t = useTranslation();
	const protocolLabel = fileDownloadInfo?.workingGroupRequestAnswer?.answerType.state === AnswerTypes.PROTOCOL.state ? ['По протоколу ', '№', fileDownloadInfo.workingGroupRequestAnswer.protocol?.num, t('Date_From'), formatDate(fileDownloadInfo.workingGroupRequestAnswer.protocol?.d)].join(' ') : '';
	const mailLabel = fileDownloadInfo?.workingGroupRequestAnswer?.answerType.state === AnswerTypes.MAIL.state && ['По письму ', fileDownloadInfo.workingGroupRequestAnswer.mailAnswer ?? ''].join('');

	return <Box is='section' width='full' maxWidth='x480' margin='auto'>
		<Tile is='main' padding='x40'>
			<Box margin='x32'>
				<Box is='h1' fontScale='h1' marginBlockEnd='x32'>
					<Icon color='success' name='checkmark-circled' size={20} mie='x16'/>
					{t('Working_group_request_your_information_accepted',
						workingGroupRequestState?.data?.number ? ['№', workingGroupRequestState.data.number].join('') : '',
						formatDate(workingGroupRequestState?.data?.date ?? new Date()),
						fileDownloadInfo?.workingGroupRequestAnswer?.answerType.state === AnswerTypes.PROTOCOL.state ? protocolLabel : mailLabel,
					)}
				</Box>
			</Box>
		</Tile>
	</Box>;
}

export default FinalInviteStep;
