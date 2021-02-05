import {
	Box,
	CheckBox,
	Field,
	Margins,
	TextInput,
	Button,
	Icon,
	Select,
	InputBox,
	ButtonGroup,
} from '@rocket.chat/fuselage';
import React, { useMemo, useState, useCallback } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { useMethod } from '../../../../../../client/contexts/ServerContext';
import { useBatchSettingsDispatch } from '../../../../../../client/contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../../../client/hooks/useForm';
import { useEndpointAction } from '../../../../../../client/hooks/useEndpointAction';
import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';
import { Pager } from '../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../client/views/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../client/views/setupWizard/StepHeader';
import { EditProposalsForTheAgenda } from '../../../../../agenda/client/views/EditProposalsForTheAgenda';

function ProposalForTheAgendaStep({ step, title, active, council }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { goToFinalStep, goToPreviousStep } = useInvitePageContext();

	const [commiting, setComitting] = useState(false);

	console.log('new part');

	const insertOrUpdatePerson = useMethod('insertOrUpdatePerson');
	const insertOrUpdateCouncilPerson = useMethod('insertOrUpdateCouncilPerson');
	const insertOrUpdateProposalsForTheAgenda = useMethod('insertOrUpdateProposalsForTheAgenda');

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const handleSave = useCallback(async () => {
		try {
			const personId = await insertOrUpdatePerson();
			if (personId) {
				const person = {
					_id: personId,
					ts: new Date(),
				};
				await insertOrUpdateCouncilPerson(council, person);
				goToFinalStep();
			}
			return false;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			return false;
		}
	}, []);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setComitting(true);
		try {
			setComitting(false);
			const isSave = await handleSave();
			if (isSave) {
				goToFinalStep();
			}
		} catch (error) {
			setComitting(false);
		}
	};

	const allFieldAreFilled = useMemo(() => Object.values().filter((current) => current === '').length === 0, []);

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<EditProposalsForTheAgenda userData={{}}/>
			</Box>
		</Margins>

		<Pager disabled={commiting} isContinueEnabled={allFieldAreFilled} onBackClick={handleBackClick} />
	</Step>;
}

export default ProposalForTheAgendaStep;
