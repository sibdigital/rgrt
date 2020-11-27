import { Button, Box, Chip, Field, Margins, Select, Label, TextAreaInput, Table } from '@rocket.chat/fuselage';
import { useMediaQuery, useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useMemo, useState } from 'react';

import { settings } from '../../../../../../settings';
import { mime } from '../../../../../../utils/lib/mimeTypes';
import { useMethod } from '../../../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../../client/contexts/TranslationContext';
import { useFormatDate } from '../../../../../../../client/hooks/useFormatDate';
import { Pager } from '../../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../../client/views/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../../client/views/setupWizard/StepHeader';
import { fileUploadToWorkingGroupRequestAnswer } from '../../../../../../ui/client/lib/fileUpload';
import GenericTable, { Th } from '../../../../../../../client/components/GenericTable';

function WorkingGroupRequestAnswerFileDownloadStep({ step, title, active, workingGroupRequest, protocolsData, contactInfoData }) {
	console.log('WorkingGroupRequestAnswerStep');
	console.log(protocolsData);
	const t = useTranslation();
	const formatDate = useFormatDate();
	const dispatchToastMessage = useToastMessageDispatch();
	const { goToPreviousStep, goToFinalStep } = useInvitePageContext();

	const [commiting, setComitting] = useState(false);
	const [newData, setNewData] = useState({
		numberId: { value: '', required: false },
		protocol: { value: '', required: false },
		section: { value: '', required: false },
		sectionItem: { value: '', required: false },
		commentary: { value: '', required: false },
	});
	const [attachedFile, setAttachedFile] = useState([]);
	const [sectionsOptions, setSectionOptions] = useState([]);
	const [sectionsItemsOptions, setSectionItemsOptions] = useState([]);
	const [context, setContext] = useState('');
	const [protocolSelectLabel, setProtocolSelectLabel] = useState('');

	const addWorkingGroupRequestAnswer = useMethod('addWorkingGroupRequestAnswer');

	useEffect(() => {
		if (protocolSelectLabel === '') {
			setProtocolSelectLabel(t('Working_group_request_invite_select_protocol'));
		}
	}, [t]);

	const fileSourceInputId = useUniqueId();
	const workingGroupRequestId = workingGroupRequest._id;
	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const mails = useMemo(() => workingGroupRequest.mails, [workingGroupRequest]);

	const mailsOptions = useMemo(() => mails?.map((mail) => [mail._id, mail.number ?? t('Not_chosen')] || [null, t('Not_chosen')]), [mails]);
	const protocolsOptions = useMemo(() => protocolsData?.map((protocol, index) => [index, protocol.num ?? '']) || [], [protocolsData]);

	const filterName = (name) => {
		const regExp = new RegExp('(<[a-z]*[0-9]*>)*(</[a-z]*[0-9]*>)*', 'gi');
		return name.replaceAll(regExp, '');
	};

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
	};

	const handleChangeSelect = (field) => (val) => {
		console.log('handle change select');
		const updateData = Object.assign({}, newData);

		if (field === 'protocol' && val !== newData.protocol.value) {
			const options = protocolsData[val]?.sections?.map((section, index) => [index, [section.num ?? '', ': ', section.name ? filterName(section.name) : ''].join('')]) || [];
			setSectionOptions(options);
			setSectionItemsOptions([]);
			updateData.sectionItem = { value: '', required: newData.sectionItem.required };
			updateData.section = { value: '', required: newData.section.required };
		}
		if (field === 'section' && val !== newData.section.value) {
			const options = protocolsData[newData.protocol.value]?.sections[val]?.items?.map((item, index) => [index, [item.num ?? '', ': ', item.name ? filterName(item.name) : ''].join('')]) || [];
			setSectionItemsOptions(options);
			updateData.sectionItem = { value: '', required: newData.sectionItem.required };
		}
		updateData[field] = { value: val, required: newData[field].required };
		console.log(updateData);
		setNewData(updateData);
	};

	const handleChangeContext = (contextField) => () => {
		if (context === '') {
			setContext(contextField);
		} else {
			setContext('');
		}
	};

	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value === '' && current.required === true).length === 0 && attachedFile.length > 0, [newData, attachedFile]);

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
			multiple: 'multiple',
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

			setAttachedFile(attachedFile.concat(filesToUpload));
			$input.remove();
		});
		$input.click();

		if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
			$input.click();
		}
	};

	const handleFileUploadChipClick = (index) => () => {
		setAttachedFile(attachedFile.filter((file, _index) => _index !== index));
	};

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const packNewData = () => {
		const dataToSend = {};
		const protocolData = protocolsData[newData.protocol.value];
		const sectionIndex = newData.section.value;
		const sectionItemIndex = newData.sectionItem.value;
		const labelNotChosen = t('Not_chosen');
		dataToSend.protocol = protocolData ? [t('Protocol'), '№', protocolData.num, t('Date_From'), formatDate(protocolData.d)].join(' ') : labelNotChosen;
		dataToSend.section = sectionIndex === '' ? labelNotChosen : [protocolData.sections[sectionIndex].num ?? '', ': ', protocolData.sections[sectionIndex].name ? filterName(protocolData.sections[sectionIndex].name) : ''].join('');
		dataToSend.sectionItem = sectionItemIndex === '' ? labelNotChosen : [protocolData.sections[sectionIndex].items[sectionItemIndex].num ?? '', ': ', protocolData.sections[sectionIndex].items[sectionItemIndex].name ? filterName(protocolData.sections[sectionIndex].items[sectionItemIndex].name) : ''].join('');
		dataToSend.commentary = newData.commentary.value.trim();
		dataToSend.ts = new Date();
		return Object.assign({}, contactInfoData, dataToSend);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setComitting(true);
		try {
			setComitting(false);

			const fileInfo = { name: attachedFile[0]?.name || '', total: attachedFile.length ?? 0 };
			const workingGroupRequestAnswer = packNewData(fileInfo);
			console.log(workingGroupRequestAnswer);
			const mailId = newData.numberId.value.trim() !== '' ? newData.numberId.value : null;
			const { answerId, mailId: newMailId } = await addWorkingGroupRequestAnswer(workingGroupRequestId, mailId, workingGroupRequestAnswer);

			if (attachedFile.length > 0) {
				await fileUploadToWorkingGroupRequestAnswer(attachedFile, { _id: workingGroupRequestId, mailId: newMailId === '' ? mailId : newMailId, answerId });
			}

			goToFinalStep();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			setComitting(false);
		}
	};

	const onRowClick = (field, id) => () => {
		const index = protocolsData.findIndex((protocol) => protocol._id === id);
		if (index > -1) {
			const protocolLabel = [t('Protocol'), '№', protocolsData[index].num, t('Date_From'), formatDate(protocolsData[index].d)].join(' ');
			setProtocolSelectLabel(protocolLabel);
			handleChangeSelect(field)(index);
		}
		setContext('');
	};

	const headerProtocol = useMemo(() => [
		mediaQuery && <Th key={'Number'} color='default'>{t('Number')}</Th>,
		mediaQuery && <Th key={'Protocol_Place'} color='default'>{t('Protocol_Place')}</Th>,
		mediaQuery && <Th key={'Date'} color='default'>{t('Date')}</Th>,
	], [mediaQuery, t]);

	const renderProtocolRow = (protocol) => {
		const { _id, d, num, place } = protocol;
		return <Table.Row tabIndex={0} onClick={onRowClick('protocol', _id)} style={{ wordWrap: 'break-word' }} role='link' action>
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'>{num}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'>{place}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'>{formatDate(d)}</Table.Cell>}
		</Table.Row>;
	};

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Working_group_request_invite_info')}</Box>

				<Box display='flex' flexDirection='column'>

					<Margins all='x8'>
						<Field>
							<Field.Label>{t('Working_group_request_select_mail')}</Field.Label>
							<Field.Row>
								<Select options={mailsOptions} onChange={handleChangeSelect('numberId')} value={newData.numberId.value} placeholder={t('Number')}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Working_group_request_invite_select_protocol')}</Field.Label>
							<Field.Row>
								{mediaQuery && <Button textAlign='left' onClick={handleChangeContext('protocolSelect')} fontScale='p1' display='inline-flex' flexGrow={1} backgroundColor='transparent' borderWidth='0.125rem' borderColor='var(--rcx-input-colors-border-color, var(--rcx-color-neutral-500, #cbced1))'>
									<Label width='100%'
										color={ protocolSelectLabel === t('Working_group_request_invite_select_protocol') ? '#9ea2a8' : ''}
										fontScale='p1'
										fontWeight={ protocolSelectLabel === t('Working_group_request_invite_select_protocol') ? '400' : '500'}>
										{protocolSelectLabel}
									</Label>
									<Box color='var(--rc-color-primary-dark)' fontFamily='RocketChat' fontSize='1.25rem' mis='auto'></Box>
								</Button>}
								{!mediaQuery && <Select width='100%' options={protocolsOptions} onChange={handleChangeSelect('protocol')} value={newData.protocol.value} placeholder={t('Working_group_request_invite_select_protocol')}/>}
							</Field.Row>
							<Field.Row>
								{context === 'protocolSelect'
								&& mediaQuery && <Field mb='x4' maxHeight='250px'>
									<GenericTable header={headerProtocol} renderRow={renderProtocolRow} results={protocolsData} total={protocolsData.length}/>
								</Field>}
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Working_group_request_invite_select_sections')}</Field.Label>
							<Field.Row>
								<Select width='100%' options={sectionsOptions} disabled={(sectionsOptions.length === 0)} onChange={handleChangeSelect('section')} value={newData.section.value} placeholder={t('Working_group_request_invite_select_sections')}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Working_group_request_invite_select_sections_items')}</Field.Label>
							<Field.Row>
								<Select width='100%' options={sectionsItemsOptions} disabled={(sectionsItemsOptions.length === 0)} onChange={handleChangeSelect('sectionItem')} value={newData.sectionItem.value} placeholder={t('Working_group_request_invite_select_sections_items')}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Commentary')}</Field.Label>
							<Field.Row>
								<TextAreaInput rows='3' style={{ whiteSpace: 'normal' }} value={newData.commentary.value} flexGrow={1} onChange={handleChange('commentary')} placeholder={`${ t('Council_patronymic_placeholder') }`} />
							</Field.Row>
						</Field>
						<Field mbe='x8'>
							<Field.Label>{t('App')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field border='2px solid #cbced1' mb='5px' width='45%'>
								<Button id={fileSourceInputId} fontScale='p1' onClick={fileUploadClick} minHeight='2.5rem' border='none' textAlign='left' backgroundColor='var(--color-dark-10)'>
									{t('Browse_Files')}
								</Button>
							</Field>
							{attachedFile?.length > 0 && <Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x4'>
								<Margins inlineEnd='x4' blockEnd='x4'>
									{attachedFile.map((file, index) => <Chip pi='x4' key={index} onClick={handleFileUploadChipClick(index)}>{file.name ?? ''}</Chip>)}
								</Margins>
							</Box>}
						</Field>
					</Margins>
				</Box>
			</Box>
		</Margins>

		<Pager disabled={commiting} isContinueEnabled={allFieldAreFilled} onBackClick={handleBackClick} />
	</Step>;
}

export default WorkingGroupRequestAnswerFileDownloadStep;
