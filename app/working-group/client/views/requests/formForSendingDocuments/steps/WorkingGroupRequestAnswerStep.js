import { Box, Chip, Field, InputBox, Margins, Select, TextInput } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState } from 'react';

import { useMethod } from '../../../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../../client/views/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../../client/views/setupWizard/StepHeader';

function WorkingGroupRequestAnswerStep({ step, title, active, setContactInfo }) {
	const { goToPreviousStep, goToNextStep } = useInvitePageContext();
	const [newData, setNewData] = useState({
		sender: { value: '', required: true },
		senderOrganization: { value: '', required: true },
		phone: { value: '', required: true },
		email: { value: '', required: true },
		unread: { value: true, required: true },
	});

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
	};
	const handleChangeSelect = (field) => (val) => {
		console.log(val);
		setNewData({ ...newData, [field]: { value: val, required: newData[field].required } });
	};

	const packNewData = () => {
		const dataToSend = {};
		Object.keys(newData).forEach((key) => {
			if (key === 'sender') {
				dataToSend[key] = { group: newData.sender.value, organization: newData.senderOrganization.value };
			} else if (key === 'unread') {
				dataToSend[key] = newData[key].value;
			} else if (key !== 'senderOrganization' && key !== 'number') {
				dataToSend[key] = newData[key].value.trim();
			}
		});
		dataToSend.ts = new Date();
		return dataToSend;
	};

	const t = useTranslation();

	const [commiting, setComitting] = useState(false);

	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value === '' && current.required === true).length === 0, [newData]);

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setContactInfo(packNewData(newData));
		goToNextStep();
		// return;
		//
		// setComitting(true);
		//
		// try {
		// 	setComitting(false);
		// 	const workingGroupRequestAnswer = packNewData(newData);
		// 	await addWorkingGroupRequestAnswer(workingGroupRequestId, newData.number.value, workingGroupRequestAnswer);
		//
		// 	//goToFinalStep();
		// } catch (error) {
		// 	dispatchToastMessage({ type: 'error', message: error });
		// 	setComitting(false);
		// }
	};

	const workingGroupOptions = useMemo(() => [
		['Член рабочей группы', 'Член рабочей группы'],
		['Федеральный орган исполнительной власти', 'Федеральный орган исполнительной власти'],
		['Субъект Российской Федерации', 'Субъект Российской Федерации'],
		['Организация', 'Организация'],
		['Иные участники', 'Иные участники'],
	], []);
	const subjectsOptions = useMemo(() => [
		['Алтайский край', 'Алтайский край'],
		['Брянская область', 'Брянская область'],
		['Республика Бурятия', 'Республика Бурятия'],
	], []);

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Working_group_request_invite_info')}</Box>

				<Box display='flex' flexDirection='column'>

					<Margins all='x8'>
						{/*<Field>*/}
						{/*	<Field.Label>{t('Working_group_request_select_mail')} <span style={ { color: 'red' } }>*</span></Field.Label>*/}
						{/*	<Field.Row>*/}
						{/*		<Select options={mailsOptions} onChange={handleChangeSelect('number')} value={newData.number.value} placeholder={t('Number')}/>*/}
						{/*	</Field.Row>*/}
						{/*</Field>*/}
						<Field>
							<Field.Label>{t('Sender')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<Select options={workingGroupOptions} onChange={handleChangeSelect('sender')} value={newData.sender.value} placeholder={t('Sender')}/>
								{/*<TextInput value={newData.sender.value} flexGrow={1} onChange={handleChange('sender')} placeholder={`${ t('Council_second_name_placeholder') }`}/>*/}
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Organization')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								{newData.sender.value === 'Субъект Российской Федерации' && <Select options={subjectsOptions} onChange={handleChangeSelect('senderOrganization')} value={newData.senderOrganization.value}/>}
								{newData.sender.value !== 'Субъект Российской Федерации' && <TextInput value={newData.senderOrganization.value} flexGrow={1} onChange={handleChange('sender')} placeholder={`${ t('Council_second_name_placeholder') }`}/>}
							</Field.Row>
						</Field>
						{/*<Field>*/}
						{/*	<Field.Label>{t('Commentary')}</Field.Label>*/}
						{/*	<Field.Row>*/}
						{/*		<TextInput value={newData.commentary.value} flexGrow={1} onChange={handleChange('commentary')} placeholder={`${ t('Council_patronymic_placeholder') }`} />*/}
						{/*	</Field.Row>*/}
						{/*</Field>*/}
						{/*<Field mbe='x8'>*/}
						{/*	<Field.Label alignSelf='stretch' htmlFor={fileSourceInputId}>{t('App')} <span style={ { color: 'red' } }>*</span></Field.Label>*/}
						{/*	<Field.Row>*/}
						{/*		<InputBox lang={'ru'} type='file' id={fileSourceInputId} onChange={handleImportFileChange} />*/}
						{/*	</Field.Row>*/}
						{/*	{files?.length > 0 && <Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x4'>*/}
						{/*		<Margins inlineEnd='x4' blockEnd='x4'>*/}
						{/*			{files.map((file, i) => <Chip pi='x4' key={i} onClick={handleFileUploadChipClick(file)}>{file.filename}</Chip>)}*/}
						{/*		</Margins>*/}
						{/*	</Box>}*/}
						{/*</Field>*/}
						<Field>
							<Field.Label>{t('Working_group_request_sender_description')}</Field.Label>
						</Field>
						<Field>
							<Field.Label>{t('Phone_number')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.phone.value} flexGrow={1} onChange={handleChange('phone')} placeholder={`${ t('Council_Organization_Position_placeholder') }`}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Email')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.email.value} flexGrow={1} onChange={handleChange('email')} placeholder={`${ t('Council_Contact_person_email_placeholder') }`}/>
							</Field.Row>
						</Field>
						{/*<Field mbe='x8'>*/}
						{/*	<Button small primary width='25%' onClick={fileUploadClick(workingGroupRequestId)} data-id='file-upload'>*/}
						{/*		<Box is='span' fontScale='p1'>{t('FileUpload')}</Box>*/}
						{/*	</Button>*/}
						{/*</Field>*/}
						{/*<Field>*/}
						{/*	<Field.Label>{t('App')} <span style={ { color: 'red' } }>*</span></Field.Label>*/}
						{/*	<Field.Row>*/}
						{/*		<TextInput value={newData.document.value} flexGrow={1} onChange={handleChange('document')} placeholder={`${ t('Council_first_name_placeholder') }`}/>*/}
						{/*	</Field.Row>*/}
						{/*</Field>*/}
					</Margins>
				</Box>
			</Box>
		</Margins>

		<Pager disabled={commiting} isContinueEnabled={allFieldAreFilled} onBackClick={handleBackClick} />
	</Step>;
}

export default WorkingGroupRequestAnswerStep;
