import { Box, Field, Margins, TextInput, Icon } from '@rocket.chat/fuselage';
import React, { useMemo, useState, useCallback } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { useMethod } from '../../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../../../client/hooks/useForm';
import { useEndpointAction } from '../../../../../../client/hooks/useEndpointAction';
import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';
import { Pager } from '../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../client/views/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../client/views/setupWizard/StepHeader';
import { isEmail } from '../../../../../utils/lib/isEmail.js';

function NewParticipantStep({ step, title, active, council, isAgenda, setUserDataClick }) {
	const t = useTranslation();
	const { goToFinalStep, goToPreviousStep, goToNextStep } = useInvitePageContext();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		values,
		handlers,
		reset,
		hasUnsavedChanges,
	} = useForm({
		surname: '',
		name: '',
		patronymic: '',
		phone: '',
		email: '',
	});
	const {
		surname,
		name,
		patronymic,
		phone,
		email,
	} = values;

	const {
		handleSurname,
		handleName,
		handlePatronymic,
		handlePhone,
		handleEmail,
	} = handlers;

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
			console.log(values);
			const personId = await insertOrUpdatePerson(values);
			console.log(personId);
			if (personId) {
				const person = {
					_id: personId,
					ts: new Date(),
				};
				console.log(person);
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

	const allFieldAreFilled = useMemo(() => Object.values(values).filter((current) => current === '').length === 0, [JSON.stringify(values)]);
	// useMemo(() => Object.values(values).filter((current) => console.log(current)), [JSON.stringify(values)]);
	// return <CreateParticipant formValues={values} formHandlers={handlers} workingGroupOptions={workingGroupOptions} handleSubmit={handleSave} step={step} title={title} active={active} commiting={commiting} goBack={goToPreviousStep}/>;

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Council_participant_info_description')}</Box>

				<Box display='flex' flexDirection='column'>


					<Margins all='x8'>
						{useMemo(() => <Field mb='x4' width='98%'>
							<Field.Label>{t('Surname')}</Field.Label>
							<Field.Row>
								<TextInput flexGrow={1} value={surname} onChange={handleSurname}/>
							</Field.Row>
						</Field>, [t, surname, handleSurname])}
						{useMemo(() => <Field mb='x4' width='98%'>
							<Field.Label>{t('Name')}</Field.Label>
							<Field.Row>
								<TextInput flexGrow={1} value={name} onChange={handleName}/>
							</Field.Row>
						</Field>, [t, name, handleName])}
						{useMemo(() => <Field mb='x4' width='98%'>
							<Field.Label>{t('Patronymic')}</Field.Label>
							<Field.Row>
								<TextInput flexGrow={1} value={patronymic} onChange={handlePatronymic}/>
							</Field.Row>
						</Field>, [t, patronymic, handlePatronymic])}
						{/* {useMemo(() => <Field mb='x4' width='98%'>
							<Field.Label>{t('Organization')}</Field.Label>
							<Field.Row>
								<TextInput flexGrow={1} value={organization} onChange={handleOrganization}/>
							</Field.Row>
						</Field>, [t, organization, handleOrganization])}
						{useMemo(() => <Field mb='x4' width='98%'>
							<Field.Label>{t('Position')}</Field.Label>
							<Field.Row>
								<TextInput flexGrow={1} value={position} onChange={handlePosition}/>
							</Field.Row>
						</Field>, [t, position, handlePosition])} */}
						{useMemo(() => <Field mb='x4' width='98%'>
							<Field.Label>{t('Phone_number')}</Field.Label>
							<Field.Row>
								<PhoneInput inputStyle={{ width: '100%', borderWidth: '0.125rem', borderRadius: '0' }} value={phone} onChange={handlePhone} country={'ru'}
									countryCodeEditable={false} placeholder={'+7 (123)-456-78-90'}/>
								{/* <TextInput flexGrow={1} value={phone} onChange={handlePhone}/> */}
							</Field.Row>
						</Field>, [t, phone, handlePhone])}
						{useMemo(() => <Field mb='x4' width='98%'>
							<Field.Label>{t('Email')}</Field.Label>
							<Field.Row>
								<TextInput flexGrow={1} value={email} error={!isEmail(email) && email.length > 0 ? 'error' : undefined} onChange={handleEmail} addon={<Icon name='mail' size='x20'/>}/>
							</Field.Row>
						</Field>, [t, email, handleEmail])}
						{/* {useMemo(() => <Field mbe='x8' width='98%'>
							<Field.Label flexGrow={0}>{t('Working_group')}</Field.Label>
							<Field.Row>
								<Select options={workingGroupOptions} onChange={handleWorkingGroup} value={workingGroup} selected={workingGroup}/>
							</Field.Row>
						</Field>, [t, workingGroup, handleWorkingGroup])} */}
					</Margins>
				</Box>
			</Box>
		</Margins>

		<Pager disabled={commiting} isContinueEnabled={allFieldAreFilled} onBackClick={handleBackClick} />
	</Step>;

// return <Box><Button>{'twe'}</Button></Box>
}

export default NewParticipantStep;
