import { Box, Margins, CheckBox, Field } from '@rocket.chat/fuselage';
import React, { useMemo, useState, useCallback } from 'react';

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
	} = useDefaultPersonForm({});
	const {
		values: contactPersonValues,
		handlers: contactPersonHandlers,
	} = useDefaultPersonForm({ isContactPerson: true });

	const {
		surname,
		name,
		patronymic,
	} = values;

	const [committing, setCommitting] = useState(false);
	const [isContactPerson, setIsContactPerson] = useState(false);

	const insertOrUpdatePerson = useMethod('insertOrUpdatePerson');
	const insertOrUpdateCouncilPerson = useMethod('insertOrUpdateCouncilPerson');

	const saveQuery = useMemo(() => values, [values]);

	const workingGroups = useEndpointData('working-groups.list', useMemo(() => ({ query: JSON.stringify({ type: { $ne: 'subject' } }) }), [])) || { workingGroups: [] };
	const saveAction = useEndpointAction('POST', 'users.createParticipant', saveQuery, t('Participant_Created_Successfully'));

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
				isContactPerson && Object.assign(person, { isContactPerson, contactPerson: contactPersonValues });

				await insertOrUpdateCouncilPerson(council, person);

				dispatchToastMessage({ type: 'success', message: t('Participant_Created_Successfully') });

				setUserDataClick(Object.assign({}, values, { _id: personId }, { type: 'person', value: [surname, name, patronymic].join(' ') }));
				goToNextStep();
			}
			return false;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			return false;
		}
	}, [values, saveQuery, saveAction, isContactPerson, contactPersonValues]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setCommitting(true);
		try {
			setCommitting(false);
			const isSave = await handleSave();
		} catch (error) {
			setCommitting(false);
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
	const contactFieldsAreFilled = useMemo(() => (!isContactPerson) || (isContactPerson && Object.values(contactPersonValues).filter((current) => current === '').length === 0), [isContactPerson, contactPersonValues]);

	return <Step active={active} working={committing} onSubmit={handleSubmit} style={stepStyle}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Council_participant_info_description')}</Box>

				<PersonForm defaultValues={values} defaultHandlers={handlers}/>

				<Box margin='x8'>
					<CheckBox checked={isContactPerson} onChange={() => setIsContactPerson(!isContactPerson)} mie='x8' />
					<Field.Label>{t('Council_Is_Contact_person')}</Field.Label>
				</Box>
				{isContactPerson
				&& <PersonForm defaultValues={contactPersonValues} defaultHandlers={contactPersonHandlers} isContactPerson={true}/>
				}
			</Box>
		</Margins>

		<Pager disabled={committing} isContinueEnabled={allFieldAreFilled && contactFieldsAreFilled} onBackClick={handleBackClick} />
	</Step>;
}

export default NewParticipantStep;
