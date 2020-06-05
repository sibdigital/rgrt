import {
	Box,
	Margins,
	Skeleton,
	InputBox
} from '@rocket.chat/fuselage';
import { useAutoFocus, useMergedRefs, useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { useMethod } from '../../../../../../client/contexts/ServerContext';
import { useBatchSettingsDispatch } from '../../../../../../client/contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../client/components/setupWizard/Pager';
import { Step } from '../../../../../../client/components/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../client/components/setupWizard/StepHeader';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../../../client/hooks/useEndpointDataExperimental';
import moment from "moment";

function CouncilInfoStep({ step, title, active }) {
	const { goToNextStep, councilState } = useInvitePageContext();
	const t = useTranslation();
	const [commiting] = useState(false);
	const handleSubmit = async (event) => {
		event.preventDefault();
		goToNextStep();
	};


	console.log('CouncilInfoStep', councilState.data)

	return <Step active={active} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Council_info_description')}</Box>

				<Box display='flex' flexDirection='column'>
					<Margins all='x8'>
						<Box is='span' color='hint' fontScale='c2'>{t('Description')}</Box>
						<Box is='h1' fontScale='h1' marginBlockEnd='x32'>{councilState.data.desc}</Box>
						<Box fontScale='micro'>{t('Date')}</Box>
						<Box color='primary' fontScale='s1' marginBlockEnd='x24'>{moment(councilState.data.d).format(moment.localeData().longDateFormat('LLL'))}</Box>
					</Margins>
				</Box>
			</Box>
		</Margins>

		<Pager/>
	</Step>;
}

export default CouncilInfoStep;
