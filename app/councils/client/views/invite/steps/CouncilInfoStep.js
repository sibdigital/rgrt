import { Box, Margins, TextAreaInput } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../client/views/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../client/views/setupWizard/StepHeader';
import { useFormatDateAndTime } from '../../../../../../client/hooks/useFormatDateAndTime';

function CouncilInfoStep({ step, title, active }) {
	const { goToNextStep, councilState } = useInvitePageContext();
	const t = useTranslation();
	const handleSubmit = async (event) => {
		event.preventDefault();
		goToNextStep();
	};

	const formatDateAndTime = useFormatDateAndTime();

	return <Step active={active} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='p1' marginBlockEnd='x16'>{t('Council_info_description')}</Box>

				<Box display='flex' flexDirection='column'>
					<Margins all='x8'>
						<Box fontScale='s1'>{t('Description')}</Box>
						<TextAreaInput style={ { whiteSpace: 'normal' } } rows='6' readOnly fontScale='p1' marginBlockEnd='x32' value={councilState.data.desc}/>
						<Box fontScale='s1'>{t('Date')}</Box>
						<Box color='primary' fontScale='p1' marginBlockEnd='x24'>{formatDateAndTime(councilState.data.d)}</Box>
					</Margins>
				</Box>
			</Box>
		</Margins>

		<Pager/>
	</Step>;
}

export default CouncilInfoStep;
