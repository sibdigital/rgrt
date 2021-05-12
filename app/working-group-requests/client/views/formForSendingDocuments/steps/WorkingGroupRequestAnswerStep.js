import { Box, Field, Margins, Select, TextInput, TextAreaInput } from '@rocket.chat/fuselage';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../client/views/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../client/views/setupWizard/StepHeader';
import { constructPersonFullFIO } from '../../../../../utils/client/methods/constructPersonFIO';
import { fileUploadToErrand } from '../../../../../ui/client/lib/fileUpload';
import { useMethod } from '../../../../../../client/contexts/ServerContext';
import { getErrandFieldsForSave, getDefaultErrandFields } from '../../../../../errand/client/views/errandsPage/ErrandForm';
import { ErrandTypes } from '../../../../../errand/client/utils/ErrandTypes';
import { useEndpointAction } from '../../../../../../client/hooks/useEndpointAction';

function WorkingGroupRequestAnswerStep({ stepStyle, step, title, active, userInfo, fileDownloadInfo }) {
	const { goToPreviousStep, goToFinalStep, workingGroupRequestState } = useInvitePageContext();
	const t = useTranslation();
	const { data } = workingGroupRequestState;

	const [committing, setCommitting] = useState(false);
	const [newData, setNewData] = useState({
		senderId: { value: '', required: false },
		sender: { value: '', required: true },
		senderOrganization: { value: '', required: true },
		phone: { value: '', required: true },
		email: { value: '', required: true },
		unread: { value: true, required: false },
	});

	const addWorkingGroupRequestAnswer = useMethod('addWorkingGroupRequestAnswer');
	const insertOrUpdateErrand = useMethod('insertOrUpdateErrand');
	const addTagsToErrandFiles = useMethod('addTagsToErrandFiles');

	const getPersonEndpoint = useEndpointAction('GET', 'users.getPerson', useMemo(() => ({
		query: JSON.stringify({ userId: data?.createdBy?.userId ?? '' }),
		fields: JSON.stringify({ surname: 1, name: 1, patronymic: 1 }),
	}), [data]), null);

	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value === '' && current.required === true).length === 0, [newData]);

	const constructSenderUserData = useCallback(() => {
		return {
			senderId: {
				value: userInfo._id ?? '',
				required: newData.senderId.required,
			},
			sender: {
				value: 'Пользователь',
				required: newData.sender.required,
			},
			senderOrganization: {
				value: constructPersonFullFIO(userInfo),
				required: newData.senderOrganization.required,
			},
			phone: {
				value: userInfo.phone ?? '',
				required: newData.phone.required,
			},
			email: {
				value: userInfo.email ?? '',
				required: newData.email.required,
			},
		};
	}, [userInfo]);

	const constructClearNewData = () => ({
		senderId: { value: '', required: false },
		sender: { value: '', required: true },
		senderOrganization: { value: '', required: true },
		phone: { value: '', required: true },
		email: { value: '', required: true },
		unread: { value: true, required: false },
	});

	useEffect(() => {
		console.log(fileDownloadInfo);
		if (userInfo) {
			setNewData({ ...newData, ...constructSenderUserData() });
		}
	}, [userInfo, constructSenderUserData]);

	const handleChangeSender = useCallback((value) => {
		console.log(userInfo);
		console.log(value);
		if (value === 'Пользователь') {
			setNewData({ ...newData, ...constructSenderUserData() });
		} else {
			setNewData({ ...constructClearNewData(),
				sender: { value, required: newData.sender.required },
				senderId: { value, required: newData.senderId.required },
			});
		}
	}, [userInfo, constructSenderUserData]);
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
		const dataToSend = {
			sender: {
				_id: newData.senderId.value,
				group: newData.sender.value,
				organization: newData.senderOrganization.value,
				phone: newData.phone.value,
				email: newData.email.value,
			}
		};
		dataToSend.unread = newData.unread.value;
		dataToSend.ts = new Date();
		return Object.assign({}, dataToSend, fileDownloadInfo.workingGroupRequestAnswer);
	};

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setCommitting(false);
		try {
			setCommitting(true);
			const dataToSave = packNewData();

			console.dir({ data, dataToSave });

			const dataToErrand = { ...dataToSave, workingGroupRequestId: data._id };

			dataToSave.sender._id && Object.assign(dataToErrand, { chargedTo: dataToSave.sender });
			data.desc && Object.assign(dataToErrand, { desc: data.desc });
			if (data.createdBy?.userId) {
				const response = await getPersonEndpoint();
				console.dir({ response });
				Object.assign(dataToErrand, { initiatedBy: { ...response._id && { ...response }, userId: data.createdBy.userId } });
			}
			dataToSave.sender?.organization && Object.assign(dataToErrand, { chargedTo: { person: { name: dataToSave.sender.organization } } });
			dataToSave.protocol && Object.assign(dataToErrand, {
				protocol: {
					_id: dataToSave.protocol._id,
					d: dataToSave.protocol.d,
					num: dataToSave.protocol.num,
					sectionId: dataToSave.protocol.sectionId,
					itemId: dataToSave.protocol.itemId,
					itemNum: dataToSave.protocol.itemNum,
					itemName: dataToSave.protocol.itemName,
				},
			});

			const errand = getDefaultErrandFields({ errand: dataToErrand, errandType: ErrandTypes.byRequestAnswer });
			const errandToSave = getErrandFieldsForSave({ errand, errandType: ErrandTypes.byRequestAnswer });
			console.dir({ errand, errandToSave });

			const errandId = await insertOrUpdateErrand(errandToSave);
			if (fileDownloadInfo.attachedFile.length > 0) {
				const filesId = await fileUploadToErrand(fileDownloadInfo.attachedFile, { _id: errandId });
				console.dir({ filesId });
				// await addTagsToErrandFiles(errandId, filesId, fileDownloadInfo.tags ?? []);
			}
			setCommitting(false);
			goToFinalStep();
		} catch (error) {
			setCommitting(false);
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

	return <Step active={active} working={committing} onSubmit={handleSubmit} style={stepStyle}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Working_group_request_invite_info')}</Box>

				<Box display='flex' flexDirection='column'>

					<Margins all='x8'>
						<Field>
							<Field.Label>{t('Working_group_request_sender')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<Select width='100%' options={workingGroupOptions} onChange={handleChangeSender} value={newData.sender.value} placeholder={t('Working_group_request_sender')}/>
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

		<Pager disabled={committing} isContinueEnabled={allFieldAreFilled} onBackClick={handleBackClick} />
	</Step>;
}

export default WorkingGroupRequestAnswerStep;



