import { Box, CheckBox, Field, Margins, TextInput, Button, Icon, Select } from '@rocket.chat/fuselage';
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
import { useRouteParameter } from '../../../../../../client/contexts/RouterContext';
import { isEmail } from '../../../../../utils/lib/isEmail.js';

// function NewParticipantStep({ step, title, active, council }) {
// 	const { goToPreviousStep, goToFinalStep } = useInvitePageContext();
// 	const [newData, setNewData] = useState({
// 		firstName: { value: '', required: true },
// 		lastName: { value: '', required: true },
// 		patronymic: { value: '', required: false },
// 		/* organization: { value: '', required: true },*/
// 		position: { value: '', required: true },
// 		contactPersonFirstName: { value: '', required: false },
// 		contactPersonLastName: { value: '', required: false },
// 		contactPersonPatronymicName: { value: '', required: false },
// 		phone: { value: '', required: true },
// 		email: { value: '', required: true },
// 	});

// 	const [isContactPerson, setIsContactPerson] = useState(false);

// 	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
// 		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
// 	};

// 	const packNewData = () => {
// 		const dataToSend = {};
// 		Object.keys(newData).forEach((key) => {
// 			dataToSend[key] = newData[key].value.trim();
// 		});
// 		if (!isContactPerson) {
// 			delete dataToSend.contactPersonFirstName;
// 			delete dataToSend.contactPersonLastName;
// 			delete dataToSend.contactPersonPatronymicName;
// 		}
// 		dataToSend.ts = new Date();
// 		return dataToSend;
// 	};


// 	const handleIAmContactPerson = () => {
// 		setNewData({
// 			...newData,
// 			contactPersonFirstName: { value: newData.contactPersonFirstName.value, required: !isContactPerson },
// 			contactPersonLastName: { value: newData.contactPersonLastName.value, required: !isContactPerson },
// 		});
// 		setIsContactPerson(!isContactPerson);
// 	};

// 	const t = useTranslation();

// 	const [commiting, setComitting] = useState(false);

// 	const dispatchToastMessage = useToastMessageDispatch();

// 	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value === '' && current.required === true).length === 0, [JSON.stringify(newData)]);

// 	const saveQuery = useMemo(() => values, [values]);
// 	const saveAction = useEndpointAction('POST', 'users.createParticipant', saveQuery, t('Participant_Created_Successfully'));

// 	const handleBackClick = () => {
// 		goToPreviousStep();
// 	};
// 	const addPersonToCouncil = useMethod('addPersonToCouncil');
// 	const councilId = council._id;
// 	const handleSubmit = async (event) => {
// 		event.preventDefault();
// 		setComitting(true);

// 		try {
// 			setComitting(false);
// 			const person = packNewData(newData);
// 			const result = await saveAction();
// 			await addPersonToCouncil(councilId, person);


// 			goToFinalStep();
// 		} catch (error) {
// 			dispatchToastMessage({ type: 'error', message: error });
// 			setComitting(false);
// 		}
// 	};

// 	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
// 		<StepHeader number={step} title={title} />

// 		<Margins blockEnd='x32'>
// 			<Box>
// 				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Council_participant_info_description')}</Box>

// 				<Box display='flex' flexDirection='column'>


// 					<Margins all='x8'>
// 						<Field>
// 							<Field.Label>{t('Council_second_name')} <span style={ { color: 'red' } }>*</span></Field.Label>
// 							<Field.Row>
// 								<TextInput value={newData.lastName.value} flexGrow={1} onChange={handleChange('lastName')} placeholder={`${ t('Council_second_name_placeholder') }`}/>
// 							</Field.Row>
// 						</Field>
// 						<Field>
// 							<Field.Label>{t('Council_first_name')} <span style={ { color: 'red' } }>*</span></Field.Label>
// 							<Field.Row>
// 								<TextInput value={newData.firstName.value} flexGrow={1} onChange={handleChange('firstName')} placeholder={`${ t('Council_first_name_placeholder') }`}/>
// 							</Field.Row>
// 						</Field>
// 						<Field>
// 							<Field.Label>{t('Council_patronymic')}</Field.Label>
// 							<Field.Row>
// 								<TextInput value={newData.patronymic.value} flexGrow={1} onChange={handleChange('patronymic')} placeholder={`${ t('Council_patronymic_placeholder') }`} />
// 							</Field.Row>
// 						</Field>
// 						{/* <Field>
// 							<Field.Label>{t('Organization_Name')} <span style={ { color: 'red' } }>*</span></Field.Label>
// 							<Field.Row>
// 								<TextInput value={newData.organization.value} flexGrow={1} onChange={handleChange('organization')} placeholder={`${ t('Council_organization') } (${ t('Required') })`}/>
// 							</Field.Row>
// 						</Field>*/}
// 						<Field>
// 							<Field.Label>{t('Council_Organization_Position')} <span style={ { color: 'red' } }>*</span></Field.Label>
// 							<Field.Row>
// 								<TextInput value={newData.position.value} flexGrow={1} onChange={handleChange('position')} placeholder={`${ t('Council_Organization_Position_placeholder') }`}/>
// 							</Field.Row>
// 						</Field>
// 						<Field.Row>
// 							<CheckBox checked={isContactPerson} onChange={handleIAmContactPerson}/>
// 							<Field.Label>{t('Council_Is_Contact_person')}</Field.Label>
// 						</Field.Row>
// 						{ isContactPerson && <Field>
// 							<Field.Label>{t('Council_Contact_person_lastname')} <span style={ { color: 'red' } }>*</span></Field.Label>
// 							<Field.Row>
// 								<TextInput value={newData.contactPersonLastName.value} flexGrow={1} onChange={handleChange('contactPersonLastName')} placeholder={`${ t('Council_Contact_person_lastname_placeholder') } (${ t('Required') })`}/>
// 							</Field.Row>
// 						</Field> }
// 						{ isContactPerson && <Field>
// 							<Field.Label>{t('Council_Contact_person_firstname')} <span style={ { color: 'red' } }>*</span></Field.Label>
// 							<Field.Row>
// 								<TextInput value={newData.contactPersonFirstName.value} flexGrow={1} onChange={handleChange('contactPersonFirstName')} placeholder={`${ t('Council_Contact_person_firstname_placeholder') } (${ t('Required') })`}/>
// 							</Field.Row>
// 						</Field> }
// 						{ isContactPerson && <Field>
// 							<Field.Label>{t('Council_Contact_person_patronymic')}</Field.Label>
// 							<Field.Row>
// 								<TextInput value={newData.contactPersonPatronymicName.value} flexGrow={1} onChange={handleChange('contactPersonPatronymicName')} placeholder={`${ t('Council_Contact_person_patronymic_placeholder') } (${ t('optional') })`}/>
// 							</Field.Row>
// 						</Field> }
// 						<Field>
// 							<Field.Label>{t('Council_Contact_person_Phone_number')} <span style={ { color: 'red' } }>*</span></Field.Label>
// 							<Field.Row>
// 								<PhoneInput inputStyle={{ width: '100%', borderWidth: '0.125rem', borderRadius: '0' }} value={newData.phone.value} onChange={handleChange('phone')} country={'ru'}
// 									countryCodeEditable={false} placeholder={'+7 (123)-456-78-90'}/>
// 								{/* <TextInput value={newData.phone.value} flexGrow={1} onChange={handleChange('phone')} placeholder={`${ t('Council_Contact_person_Phone_number_placeholder') }`}/> */}
// 							</Field.Row>
// 						</Field>
// 						<Field>
// 							<Field.Label>{t('Council_Contact_person_email')} <span style={ { color: 'red' } }>*</span></Field.Label>
// 							<Field.Row>
// 								<TextInput value={newData.email.value} flexGrow={1} onChange={handleChange('email')} placeholder={`${ t('Council_Contact_person_email_placeholder') }`}/>
// 							</Field.Row>
// 						</Field>
// 						{/* <Field>
// 							<Field.Row>
// 								<CheckBox
// 									id={agreeTermsAndPrivacyId}
// 									name='agreeTermsAndPrivacy'
// 									checked={agreeTermsAndPrivacy}
// 									onChange={({ currentTarget: { checked } }) => {
// 										setAgreeTermsAndPrivacy(checked);
// 									}}
// 								/>
// 								<Field.Label htmlFor={agreeTermsAndPrivacyId}>
// 									{t('Register_Server_Registered_I_Agree')} <a href='https://rocket.chat/terms'>{t('Terms')}</a> & <a href='https://rocket.chat/privacy'>{t('Privacy_Policy')}</a>
// 								</Field.Label>
// 							</Field.Row>
// 						</Field>*/}
// 					</Margins>
// 				</Box>
// 			</Box>
// 		</Margins>

// 		<Pager disabled={commiting} isContinueEnabled={allFieldAreFilled} onBackClick={handleBackClick} />
// 	</Step>;
// }

function NewParticipantStep({ step, title, active, council }) {
	const t = useTranslation();
	const { goToFinalStep, goToPreviousStep } = useInvitePageContext();

	const {
		values,
		handlers,
		reset,
		hasUnsavedChanges,
	} = useForm({
		surname: '',
		name: '',
		patronymic: '',
		// organization: '',
		// position: '',
		phone: '',
		email: '',
		// workingGroup: '',
	});
	const {
		surname,
		name,
		patronymic,
		// organization,
		// position,
		phone,
		email,
		// workingGroup,
	} = values;

	const {
		handleSurname,
		handleName,
		handlePatronymic,
		// handleOrganization,
		// handlePosition,
		handlePhone,
		handleEmail,
		// handleWorkingGroup,
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
				const person = values;
				person._id = personId;
				console.log(person);
				await insertOrUpdateCouncilPerson(councilId, person);
				return true;
			}
			return false;
		} catch(error) {
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

function CreateParticipant({ formValues, formHandlers, workingGroupOptions, handleSubmit, step, title, active, commiting, goBack, ...props }) {
	const t = useTranslation();

	const handleBackClick = () => {
		goToPreviousStep();
	};	

	const {
		surname,
		name,
		patronymic,
		organization,
		position,
		phone,
		email,
		workingGroup,
	} = formValues;
	
	const {
		handleSurname,
		handleName,
		handlePatronymic,
		handleOrganization,
		handlePosition,
		handlePhone,
		handleEmail,
		handleWorkingGroup,
	} = formHandlers;

	
}
