import { Box, Field, Margins, TextInput, TextAreaInput } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../../client/views/setupWizard/Step';
import { StepHeader } from '../../../../../../../client/views/setupWizard/StepHeader';
import { useInvitePageContext } from '../InvitePageState';
import { useFormatDate } from '/client/hooks/useFormatDate';

function WorkingGroupRequestInfoStep({ step, title, active }) {
	const { goToNextStep, workingGroupRequestState } = useInvitePageContext();
	const formatDate = useFormatDate();
	const number = useMemo(() => {
		if (workingGroupRequestState.data) {
			return 'От ' + formatDate(workingGroupRequestState.data.ts ?? new Date()) + ' № ' + workingGroupRequestState.data.number ?? ' ';
		}
		return '';
	}, [workingGroupRequestState]);
	const t = useTranslation();
	const handleSubmit = async (event) => {
		event.preventDefault();
		goToNextStep();
	};
	console.log(workingGroupRequestState.data);

	return <Step active={active} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='p1' marginBlockEnd='x16'>{t('Working_group_request_invite_description')}</Box>
				<Field>
					<Field.Label>{t('Query')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} readOnly fontScale='p1' value={number}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput flexGrow={1} value={workingGroupRequestState.data.desc} readOnly style={ { whiteSpace: 'normal' } } fontScale='p1' rows='5'/>
					</Field.Row>
				</Field>
				{/*<Box display='flex' flexDirection='column'>*/}
				{/*	<Margins all='x8'>*/}
				{/*		<Box fontScale='s1'>{t('Description')}</Box>*/}
				{/*		<TextAreaInput value={workingGroupRequestState.data.desc} style={ { whiteSpace: 'normal', border: 'none' } } rows='6' readOnly fontScale='p1' marginBlockEnd='x32'/>*/}
				{/*	</Margins>*/}
				{/*</Box>*/}
			</Box>
		</Margins>

		<Pager/>
	</Step>;
}

export default WorkingGroupRequestInfoStep;
