import { Box, Margins } from '@rocket.chat/fuselage';
import React, { useMemo, useState, useCallback } from 'react';
import 'react-phone-input-2/lib/style.css';

import { useMethod } from '../../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointAction } from '../../../../../../client/hooks/useEndpointAction';
import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';
import { Pager } from '../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../client/views/setupWizard/Step';
import { StepHeader } from '../../../../../../client/views/setupWizard/StepHeader';
import { useInvitePageContext } from '../InvitePageState';
import PersonForm, { useDefaultPersonForm } from '../../../../../persons/client/views/PersonForm';

function NewParticipantStep({ stepStyle = {}, step, title, active, council, isAgenda, setUserDataClick }) {
	const t = useTranslation();
	const { goToFinalStep, goToPreviousStep, goToNextStep } = useInvitePageContext();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		values,
		handlers,
	} = useDefaultPersonForm();

	const {
		surname,
		name,
		patronymic,
	} = values;

	console.log('new part');

	const insertOrUpdatePerson = useMethod('insertOrUpdatePerson');
	const insertOrUpdateCouncilPerson = useMethod('insertOrUpdateCouncilPerson');

	const councilId = council._id;

	const saveQuery = useMemo(() => values, [values]);

	const workingGroups = useEndpointData('working-groups.list', useMemo(() => ({ query: JSON.stringify({ type: { $ne: 'subject' } }) }), [])) || { workingGroups: [] };
	const saveAction = useEndpointAction('POST', 'users.createParticipant', saveQuery, t('Participant_Created_Successfully'));

	const [commiting, setComitting] = useState(false);

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const handleSave = useCallback(async () => {
		try {
			const personId = await insertOrUpdatePerson(values);
			if (personId) {
				const person = {
					_id: personId,
					ts: new Date(),
				};

				await insertOrUpdateCouncilPerson(council, person);

				dispatchToastMessage({ type: 'success', message: t('Participant_Created_Successfully') });
				if (!isAgenda) {
					goToFinalStep();
				} else {
					setUserDataClick(Object.assign({}, values, { _id: personId }, { type: 'person', value: [surname, name, patronymic].join(' ') }));
					goToNextStep();
				}
			}
			return false;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			return false;
		}
	}, [values, saveQuery, saveAction]);

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

	const workingGroupOptions = useMemo(() => {
		const res = [['', t('Not_chosen')]];
		if (workingGroups && workingGroups.workingGroups?.length > 0) {
			return res.concat(workingGroups.workingGroups.map((workingGroup) => [workingGroup.title, workingGroup.title]));
		}
		return res;
	}, [workingGroups]);

	const allFieldAreFilled = useMemo(() => Object.values(values).filter((current) => current === '').length === 0, [values]);

	return <Step active={active} working={commiting} onSubmit={handleSubmit} style={stepStyle}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Council_participant_info_description')}</Box>

				<PersonForm defaultValues={values} defaultHandlers={handlers}/>
			</Box>
		</Margins>

		<Pager disabled={commiting} isContinueEnabled={allFieldAreFilled} onBackClick={handleBackClick} />
	</Step>;
}

export default NewParticipantStep;
