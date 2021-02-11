import { Box, Field, Margins, Select, TextInput, TextAreaInput } from '@rocket.chat/fuselage';
import React, { useMemo, useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../client/views/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../client/views/setupWizard/StepHeader';
import { constructPersonFullFIO } from '../../../../../utils/client/methods/constructPersonFIO';
import { fileUploadToWorkingGroupRequestAnswer } from '../../../../../ui/client/lib/fileUpload';
import { useMethod } from '/client/contexts/ServerContext';

function WorkingGroupRequestAnswerStep({ step, title, active, setContactInfo, userInfo, fileDownloadInfo }) {
	const { goToPreviousStep, goToNextStep, goToFinalStep } = useInvitePageContext();

	const addWorkingGroupRequestAnswer = useMethod('addWorkingGroupRequestAnswer');

	const [newData, setNewData] = useState({
		sender: { value: '', required: true },
		senderOrganization: { value: '', required: true },
		phone: { value: '', required: true },
		email: { value: '', required: true },
		unread: { value: true, required: true },
	});

	useEffect(() => {
		console.log(fileDownloadInfo);
		if (userInfo) {
			setNewData({ ...newData,
				sender: { value: 'Пользователь', required: newData.sender.required },
				senderOrganization: { value: constructPersonFullFIO(userInfo), required: newData.senderOrganization.required },
				phone: { value: userInfo.phone ?? '', required: newData.phone.required },
				email: { value: userInfo.emails[0]?.address ?? '', required: newData.email.required },
			});
		}
	}, [userInfo]);

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
	};
	const handleChangeSelect = (field) => (val) => {
		setNewData({ ...newData, [field]: { value: val, required: newData[field].required } });
	};
	const handleChangePhone = (val) => {
		console.log(val);
		setNewData({ ...newData, phone: { value: val, required: newData.phone.required } });
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
		return Object.assign({}, dataToSend, fileDownloadInfo.workingGroupRequestAnswer);
		// return dataToSend;
	};

	const t = useTranslation();

	const [commiting, setComitting] = useState(false);

	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value === '' && current.required === true).length === 0, [newData]);

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			// setContactInfo(packNewData(newData));
			const dataToSave = packNewData();
			const { answerId, mailId: newMailId } = await addWorkingGroupRequestAnswer(fileDownloadInfo.workingGroupRequestId, fileDownloadInfo.mailId, dataToSave);
			await fileUploadToWorkingGroupRequestAnswer(fileDownloadInfo.attachedFile, {
				_id: fileDownloadInfo.workingGroupRequestId,
				mailId: newMailId === '' ? fileDownloadInfo.mailId : newMailId,
				answerId,
			});
			goToFinalStep();
		} catch (error) {
			console.log(error);
		}
	};

	const workingGroupOptions = useMemo(() => [
		['Пользователь', 'Пользователь'],
		['Член рабочей группы', 'Член рабочей группы'],
		['Федеральный орган исполнительной власти', 'Федеральный орган исполнительной власти'],
		['Субъект Российской Федерации', 'Субъект Российской Федерации'],
		['Организация', 'Организация'],
		['Иные участники', 'Иные участники'],
		['Другое', 'Другое'],
	], []);

	const subjectsOptions = useMemo(() => [
		['Алтайский край', 'Алтайский край'],
		['Брянская область', 'Брянская область'],
		['Республика Бурятия', 'Республика Бурятия'],
	], []);

	return <Step active={active} working={commiting} onSubmit={handleSubmit} style={{ maxWidth: '450px' }}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Working_group_request_invite_info')}</Box>

				<Box display='flex' flexDirection='column'>

					<Margins all='x8'>
						<Field>
							<Field.Label>{t('Working_group_request_sender')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<Select width='100%' options={workingGroupOptions} onChange={handleChangeSelect('sender')} value={newData.sender.value} placeholder={t('Working_group_request_sender')}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Working_group_request_sender_organization')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								{newData.sender.value === 'Субъект Российской Федерации' && <Select width='100%' options={subjectsOptions} onChange={handleChangeSelect('senderOrganization')} value={newData.senderOrganization.value} placeholder={t('Working_group_request_sender_organization')}/>}
								{newData.sender.value !== 'Субъект Российской Федерации'
								&& <TextAreaInput style={{ whiteSpace: 'normal' }} value={newData.senderOrganization.value} flexGrow={1} onChange={handleChange('senderOrganization')} placeholder={t('Working_group_request_sender_organization')}/>}
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Working_group_request_sender_description')}</Field.Label>
						</Field>
						<Field>
							<Field.Label>{t('Phone_number')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<PhoneInput inputStyle={{ width: '100%', borderWidth: '0.125rem', borderRadius: '0' }} value={newData.phone.value} onChange={handleChangePhone} country={'ru'}
									countryCodeEditable={false} placeholder={'+7 (123)-456-78-90'}/>
							</Field.Row>
						</Field>
						{/*<Field>*/}
						{/*	<Field.Label>{t('Phone_number')} <span style={ { color: 'red' } }>*</span></Field.Label>*/}
						{/*	<Field.Row>*/}
						{/*		<TextInput value={newData.phone.value} flexGrow={1} onChange={handleChange('phone')} placeholder={`${ t('Council_Contact_person_Phone_number_placeholder') }`}/>*/}
						{/*	</Field.Row>*/}
						{/*</Field>*/}
						<Field>
							<Field.Label>{t('Email')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.email.value} flexGrow={1} onChange={handleChange('email')} placeholder={`${ t('Council_Contact_person_email_placeholder') }`}/>
							</Field.Row>
						</Field>
					</Margins>
				</Box>
			</Box>
		</Margins>

		<Pager disabled={commiting} isContinueEnabled={allFieldAreFilled} onBackClick={handleBackClick} />
	</Step>;
}

export default WorkingGroupRequestAnswerStep;



