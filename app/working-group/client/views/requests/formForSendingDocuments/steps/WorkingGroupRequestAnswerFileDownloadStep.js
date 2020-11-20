import { Button, Box, Chip, Field, InputBox, Margins, Select, TextInput } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState } from 'react';
import { settings } from '../../../../../../settings';
import { mime } from '../../../../../../utils/lib/mimeTypes';

import { useMethod } from '../../../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../../client/views/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../../client/views/setupWizard/StepHeader';
import { fileUploadToWorkingGroupRequestAnswer, uploadFileWithWorkingGroupRequestAnswer } from '../../../../../../ui/client/lib/fileUpload';

function WorkingGroupRequestAnswerFileDownloadStep({ step, title, active, workingGroupRequest, protocolsData, contactInfoData }) {
	console.log('WorkingGroupRequestAnswerStep');
	console.log(protocolsData);
	const t = useTranslation();
	const { goToPreviousStep, goToFinalStep } = useInvitePageContext();

	const [newData, setNewData] = useState({
		numberId: { value: '', required: true },
		protocol: { value: '', required: false },
		section: { value: '', required: false },
		sectionItem: { value: '', required: false },
		commentary: { value: '', required: false },
	});
	const [attachedFile, setAttachedFile] = useState([]);
	//const [files, setFiles] = useState([]);
	const [sectionsOptions, setSectionOptions] = useState([]);
	const [sectionsItemsOptions, setSectionItemsOptions] = useState([]);

	const fileSourceInputId = useUniqueId();
	const workingGroupRequestId = workingGroupRequest._id;

	const mails = useMemo(() => workingGroupRequest.mails, [workingGroupRequest]);

	const mailsOptions = useMemo(() => mails?.map((mail) => [mail._id, mail.number ?? ''] || []), [mails]);
	const protocolsOptions = useMemo(() => protocolsData?.map((protocol, index) => [index, protocol.num ?? '']) || [], [protocolsData]);

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
	};

	const handleChangeSelect = (field) => (val) => {
		if (field === 'protocol' && val !== newData.protocol.value) {
			const options = protocolsData[val]?.sections?.map((section, index) => [index, section.num ?? '']) || [];
			setSectionOptions(options);
		}
		if (field === 'section' && val !== newData.section.value) {
			const options = protocolsData[newData.protocol.value]?.sections[val]?.items?.map((item, index) => [index, item.num ?? '']) || [];
			setSectionItemsOptions(options);
		}
		setNewData({ ...newData, [field]: { value: val, required: newData[field].required } });
	};

	const [commiting, setComitting] = useState(false);

	const dispatchToastMessage = useToastMessageDispatch();

	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value === '' && current.required === true).length === 0 && attachedFile.length > 0, [newData, attachedFile]);

	const addWorkingGroupRequestAnswer = useMethod('addWorkingGroupRequestAnswer');

	const fileUploadClick = async (e) => {
		e.preventDefault();
		console.log('fileUpload');
		if (!settings.get('FileUpload_Enabled')) {
			console.log('!fileUpload_enabled');
			return null;
		}
		const $input = $(document.createElement('input'));
		$input.css('display', 'none');
		$input.attr({
			id: 'fileupload-input',
			type: 'file',
		});

		$(document.body).append($input);

		$input.one('change', async function(e) {
			const filesToUpload = [...e.target.files].map((file) => {
				console.log(file);
				Object.defineProperty(file, 'type', {
					value: mime.lookup(file.name),
				});
				return {
					file,
					name: file.name,
				};
			});
			// const fileInfo = await fileUploadToWorkingGroupRequestAnswer(filesToUpload, {});
			// if (filesToUpload && fileInfo) {
			// 	console.log(fileInfo);
			// 	filesToUpload.name = fileInfo.fileName;
			// 	filesToUpload.file.name = fileInfo.fileName;
			// 	setAttachedFile(filesToUpload);
			// }
			console.log(filesToUpload);
			setAttachedFile(filesToUpload);
			$input.remove();
		});
		$input.click();

		if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
			$input.click();
		}
	};

	// const handleImportFileChange = async (event) => {
	// 	event = event.originalEvent || event;
	//
	// 	let { files } = event.target;
	// 	if (!files || (files.length === 0)) {
	// 		files = (event.dataTransfer != null ? event.dataTransfer.files : undefined) || [];
	// 	}
	//
	// 	Array.from(files, (file) => {
	// 		const reader = new FileReader();
	// 		reader.readAsDataURL(file);
	// 		reader.onloadend = function(e) {
	// 			setFiles((files) => files.concat([{
	// 				content: reader.result.split(';base64,')[1],
	// 				contentType: file.type,
	// 				filename: file.name,
	// 			}]));
	// 		};
	// 	});
	// };

	const handleFileUploadChipClick = () => {
		//setFiles((files) => files.filter((_file) => _file !== file));
		setAttachedFile([]);
	};

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const packNewData = (fileInfo) => {
		const dataToSend = {};
		dataToSend.protocol = protocolsData[newData.protocol.value].num;
		dataToSend.section = protocolsData[newData.protocol.value].sections[newData.section.value].num;
		dataToSend.sectionItem = protocolsData[newData.protocol.value].sections[newData.section.value].items[newData.sectionItem.value].num;
		dataToSend.commentary = newData.commentary.value.trim();
		if (fileInfo) {
			dataToSend.document = { _id: fileInfo.id ?? '', fileName: fileInfo.name ?? '' };
		}
		dataToSend.ts = new Date();
		return Object.assign({}, contactInfoData, dataToSend);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setComitting(true);
		try {
			setComitting(false);

			const fileInfo = { name: attachedFile[0]?.name || '' };
			const workingGroupRequestAnswer = packNewData(fileInfo);
			console.log(workingGroupRequestAnswer);
			const answerId = await addWorkingGroupRequestAnswer(workingGroupRequestId, newData.numberId.value, workingGroupRequestAnswer);

			if (attachedFile.length > 0) {
				await uploadFileWithWorkingGroupRequestAnswer(workingGroupRequestId, newData.numberId.value, answerId, {
					fileName: attachedFile[0].name,
					file: attachedFile[0].file,
				});
			}

			goToFinalStep();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			setComitting(false);
		}
	};

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Working_group_request_invite_info')}</Box>

				<Box display='flex' flexDirection='column'>

					<Margins all='x8'>
						<Field>
							<Field.Label>{t('Working_group_request_select_mail')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<Select options={mailsOptions} onChange={handleChangeSelect('numberId')} value={newData.numberId.value} placeholder={t('Number')}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Working_group_request_invite_select_protocol')}</Field.Label>
							<Field.Row>
								<Select options={protocolsOptions} onChange={handleChangeSelect('protocol')} value={newData.protocol.value} placeholder={t('Working_group_request_invite_select_protocol')}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Working_group_request_invite_select_sections')}</Field.Label>
							<Field.Row>
								<Select options={sectionsOptions} disabled={(sectionsOptions.length === 0)} onChange={handleChangeSelect('section')} value={newData.section.value} placeholder={t('Working_group_request_invite_select_sections')}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Working_group_request_invite_select_sections_items')}</Field.Label>
							<Field.Row>
								<Select options={sectionsItemsOptions} disabled={(sectionsItemsOptions.length === 0)} onChange={handleChangeSelect('sectionItem')} value={newData.sectionItem.value} placeholder={t('Working_group_request_invite_select_sections_items')}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Commentary')}</Field.Label>
							<Field.Row>
								<TextInput value={newData.commentary.value} flexGrow={1} onChange={handleChange('commentary')} placeholder={`${ t('Council_patronymic_placeholder') }`} />
							</Field.Row>
						</Field>
						{/*<Field>*/}
						{/*	<Field.Label>{t('File')}</Field.Label>*/}
						{/*	<Field.Row>*/}
						{/*		<Button primary onClick={fileUploadClick}>{t('File')}</Button>*/}
						{/*	</Field.Row>*/}
						{/*</Field>*/}
						<Field mbe='x8'>
							<Field.Label>{t('App')} <span style={ { color: 'red' } }>*</span></Field.Label>
							{/*<Field.Row>*/}
							{/*	<InputBox id={fileSourceInputId} onClick={fileUploadClick} placeholder={t('Browse_Files')}>*/}
							{/*		/!*<Box fontScale='p1' is='span'>{t('Browse_Files')}</Box>*!/*/}
							{/*	</InputBox>*/}
							{/*</Field.Row>*/}
							<Field border='2px solid #cbced1' mb='5px' width='45%'>
								<Button id={fileSourceInputId} fontScale='p1' onClick={fileUploadClick} minHeight='2.5rem' border='none' textAlign='left' backgroundColor='var(--color-dark-10)'>
									{t('Browse_Files')}
								</Button>
							</Field>
							{attachedFile?.length > 0 && <Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x4'>
								<Margins inlineEnd='x4' blockEnd='x4'>
									{attachedFile.map((file, i) => <Chip pi='x4' key={i} onClick={handleFileUploadChipClick}>{file.name}</Chip>)}
								</Margins>
							</Box>}
						</Field>
						{/*<Field mbe='x8'>*/}
						{/*	<Field.Label alignSelf='stretch' htmlFor={fileSourceInputId}>{t('App')} <span style={ { color: 'red' } }>*</span></Field.Label>*/}
						{/*	<Field.Row>*/}
						{/*		<InputBox type='file' multiple id={fileSourceInputId} onChange={handleImportFileChange} />*/}
						{/*	</Field.Row>*/}
						{/*	{files?.length > 0 && <Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x4'>*/}
						{/*		<Margins inlineEnd='x4' blockEnd='x4'>*/}
						{/*			{files.map((file, i) => <Chip pi='x4' key={i} onClick={handleFileUploadChipClick(file)}>{file.filename}</Chip>)}*/}
						{/*		</Margins>*/}
						{/*	</Box>}*/}
						{/*</Field>*/}
					</Margins>
				</Box>
			</Box>
		</Margins>

		<Pager disabled={commiting} isContinueEnabled={allFieldAreFilled} onBackClick={handleBackClick} />
	</Step>;
}

export default WorkingGroupRequestAnswerFileDownloadStep;
