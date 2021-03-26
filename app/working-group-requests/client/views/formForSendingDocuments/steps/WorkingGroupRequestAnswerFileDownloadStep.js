import {
	Button, Box, Field,
	Chip, Label,
	Margins, Select, Icon,
	TextInput, TextAreaInput,
	Table,
} from '@rocket.chat/fuselage';
import { useMediaQuery, useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import ReactTooltip from 'react-tooltip';

import { settings } from '../../../../../settings';
import { mime } from '../../../../../utils/lib/mimeTypes';
import { useToastMessageDispatch } from '../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useFormatDate } from '../../../../../../client/hooks/useFormatDate';
import { Pager } from '../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../client/views/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../client/views/setupWizard/StepHeader';
import { filesValidation } from '../../../../../ui/client/lib/fileUpload';
import GenericTable, { Th } from '../../../../../../client/components/GenericTable';
import { ClearButton } from '../../../../../utils/client/views/ClearButton';
import { preProcessingProtocolItems } from '../../lib';
import { ProtocolItemsField } from '../../RequestForm';
import './reactTooltip.css';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

const FilterByText = ({ protocolsData, setProtocolsData, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		const regExp = new RegExp('^'.concat(text), 'i');
		// console.log(protocolsData);
		try {
			setProtocolsData(protocolsData.filter((protocol) => (protocol.num && protocol.num.match(regExp))
				|| text.length === 0));
		} catch (e) {
			setProtocolsData(protocolsData);
			console.log(e);
		}
	}, [text, protocolsData, setProtocolsData]);

	return <Box mb='x16' display='flex' flexDirection='column' { ...props }>
		<Field.Label>{t('Working_group_request_invite_find_by_number')}</Field.Label>
		<TextInput flexShrink={0} placeholder={t('Working_group_request_invite_find_by_number')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

const FilterByDateRange = ({ protocolsData, setProtocolsData, ...props }) => {
	const t = useTranslation();
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const handleStartDateChange = useCallback((selectedDate) => {
		// console.log(selectedDate);
		setStartDate(selectedDate);
		const date = new Date(endDate);
		if (date.getTime() < new Date(startDate).getTime() || !endDate) {
			setEndDate(new Date());
		}
	}, [endDate]);
	const handleEndDateChange = useCallback((selectedDate) => {
		// console.log(selectedDate);
		// console.log(startDate);
		// console.log(new Date(startDate).getTime());
		// console.log(new Date(startDate).getTime());
		if (new Date(selectedDate).getTime() >= new Date(startDate).getTime()) {
			setEndDate(selectedDate);
		}
	}, [startDate]);

	useEffect(() => {
		try {
			if (startDate !== '' && endDate !== '') {
				setProtocolsData(protocolsData.filter((protocol) => new Date(startDate).getTime() <= new Date(protocol.d).getTime() && new Date(endDate).getTime() >= new Date(protocol.d).getTime()));
			}
		} catch (e) {
			setProtocolsData(protocolsData);
			console.log(e);
		}
	}, [startDate, endDate, protocolsData, setProtocolsData]);

	return <Box mb='x16' display='flex' flexDirection='column' { ...props }>
		<Field.Label>{t('Select_date_range')}</Field.Label>
		<Field.Row>
			<DatePicker
				mie='x8'
				dateFormat={'dd.MM.yyyy'}
				selected={startDate}
				onChange={handleStartDateChange}
				locale='ru'
				customInput={<TextInput/>}
				popperClassName='date-picker'
			/>
			<DatePicker
				dateFormat='dd.MM.yyyy'
				selected={endDate}
				minDate={startDate}
				onChange={handleEndDateChange}
				locale='ru'
				customInput={<TextInput/>}
				popperClassName='date-picker'
			/>
		</Field.Row>
	</Box>;
};

function WorkingGroupRequestAnswerFileDownloadStep({
	stepStyle,
	step,
	title,
	active,
	workingGroupRequest,
	protocol,
	setInfo,
	setVerticalContext,
	protocolSelected,
	setProtocolSelected,
	sectionSelected,
	setSectionSelected,
	protocolItemsId,
	setProtocolItemsId,
}) {
	console.log('WorkingGroupRequestAnswerStep');
	// console.log(protocolsData);
	const t = useTranslation();
	const formatDate = useFormatDate();
	const dispatchToastMessage = useToastMessageDispatch();
	const { goToPreviousStep, goToNextStep } = useInvitePageContext();

	const [committing, setCommitting] = useState(false);
	const [cache, setCache] = useState(new Date());
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
	const [protocolSelectLabel, setProtocolSelectLabel] = useState('');
	const [protocolSectionSelectLabel, setProtocolSectionSelectLabel] = useState('');
	const [protocolSelectItemLabel, setProtocolSelectItemLabel] = useState('');
	const [staticFileIndex, setStaticFileIndex] = useState(0);
	const [answerTypeContext, setAnswerTypeContext] = useState('mail');
	const [customAnswerMailLabel, setCustomAnswerMailLabel] = useState('');

	const fileSourceInputId = useUniqueId();
	const workingGroupRequestId = workingGroupRequest._id;
	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const documentsHelpTooltipLabel = useMemo(() => 'Загрузите не пустые файлы', []);
	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value === '' && current.required === true).length === 0 && attachedFile.length > 0, [newData, attachedFile]);
	const typeAnswerOptions = useMemo(() => [['mail', t('Working_group_mail')], ['protocol', t('Working_group_request_invite_select_protocol')]], [t]);

	useEffect(() => {
		// if (protocolSelectLabel === '') {
		// 	setProtocolSelectLabel(t('Working_group_request_invite_select_protocol'));
		// }
		// setProtocolsFindData(protocolsData ?? []);
		workingGroupRequest.mail && setCustomAnswerMailLabel(workingGroupRequest.mail);
		// workingGroupRequest.number && workingGroupRequest.date && setAnswerMailLabel(['#', workingGroupRequest.number, ' от ', formatDate(workingGroupRequest.date)].join(''));
		console.log({ protocol });
		if (protocolSelected) {
			const protocolLabel = [t('Protocol'), '№', protocolSelected.num, 'от', formatDate(protocolSelected.d)].join(' ');
			setProtocolSelectLabel(protocolLabel);
		}
	}, [t, workingGroupRequest, protocolSelected]);

	useEffect(() => {
		if (sectionSelected) {
			const protocolSectionLabel = [t('Working_group_request_invite_select_sections'), ' №', sectionSelected.num].join('');
			setProtocolSectionSelectLabel(protocolSectionLabel);
		}
	}, [sectionSelected, t]);

	useEffect(() => {
		console.log({ protocolItemsId });
		if (protocolItemsId && protocolItemsId.length > 0) {
			const protocolItemLabel = [t('Working_group_request_invite_select_sections_items'), ' №', protocolItemsId[0].num].join('');
			setProtocolSelectItemLabel(protocolItemLabel);
		}
	}, [protocolItemsId, t]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
	};

	const handleClearSelectItemsOptions = useCallback(() => {
		setProtocolItemsId([]);
		setProtocolSelectItemLabel('');
	}, [setProtocolItemsId]);

	const handleClearSelectOptions = useCallback(() => {
		setSectionSelected(null);
		setProtocolSectionSelectLabel('');
	}, [setSectionSelected]);

	const handleClearProtocol = useCallback(() => {
		setProtocolSelected(null);
		setSectionSelected(null);
		setProtocolItemsId([]);
		setProtocolSelectLabel('');
		setProtocolSectionSelectLabel('');
		setProtocolSelectItemLabel('');
	}, [setProtocolSelected, setSectionSelected, setProtocolItemsId]);

	const fileUploadClick = async (e) => {
		e.preventDefault();
		console.log('fileUpload');
		if (!settings.get('FileUpload_Enabled')) {
			console.log('!fileUpload_enabled');
			return null;
		}
		const $input = $(document.createElement('input'));
		let fileIndex = staticFileIndex;
		$input.css('display', 'none');
		$input.attr({
			id: 'fileupload-input',
			type: 'file',
			multiple: 'multiple',
		});

		$(document.body).append($input);

		$input.one('change', async function(e) {
			const filesToUpload = [...e.target.files].map((file) => {
				// console.log(file);
				Object.defineProperty(file, 'type', {
					value: mime.lookup(file.name),
				});
				fileIndex++;
				return {
					file,
					name: file.name,
					id: fileIndex,
				};
			});
			setStaticFileIndex(fileIndex);

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
		dataToSend.answerType = answerTypeContext;

		if (answerTypeContext === 'protocol') {
			console.log({ newData });
			console.log({ protocolSelected, sectionSelected, protocolItemsId });
			protocolSelected && Object.assign(dataToSend, { protocolId: protocolSelected._id });
			sectionSelected && Object.assign(dataToSend, { sectionId: sectionSelected._id });
			protocolItemsId && Object.assign(dataToSend, { sectionItemsId: protocolItemsId });
			dataToSend.protocol = {
				_id: protocolSelected?._id ?? '',
				title: protocolSelected ? [t('Protocol'), '№', protocolSelected.num, t('Date_From'), formatDate(protocolSelected.d)].join(' ') : '',
				section: {
					_id: sectionSelected?._id ?? '',
					title: sectionSelected ? [sectionSelected.num ?? '', ': ', sectionSelected.name ? preProcessingProtocolItems(sectionSelected.name) : ''].join('') : '',
				},
				sectionItem: protocolItemsId?.map((item) => ({
					_id: item._id,
					title: [item.num ?? '', ': ', item.name ? preProcessingProtocolItems(item.name) : ''].join(''),
				})) || [],
			};
		} else if (answerTypeContext === 'mail') {
			dataToSend.mailAnswer = customAnswerMailLabel;
		}

		dataToSend.commentary = newData.commentary.value.trim();
		dataToSend.ts = new Date();
		return Object.assign({}, dataToSend);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setCommitting(true);
		try {
			setCommitting(false);

			const workingGroupRequestAnswer = packNewData();
			const mailId = newData.numberId.value.trim() !== '' ? newData.numberId.value : null;
			let validationArray = [];

			if (attachedFile.length > 0) {
				validationArray = await filesValidation(attachedFile);
				if (validationArray.length > 0) {
					const attachedFilesBuf = attachedFile;
					validationArray.map((errFile) => attachedFilesBuf.map((file) => {
						if (errFile.id === file.id) {
							file.fail = true;
							file.error = errFile.error;
						}
						return file;
					}));
					dispatchToastMessage({ type: 'error', message: t('Working_group_request_invite_file_upload_failed') });
					setCommitting(false);
					setAttachedFile(attachedFilesBuf);
					onChange();
				} else {
					setInfo({ workingGroupRequestId, mailId, workingGroupRequestAnswer, attachedFile });
					console.log({ workingGroupRequestId, mailId, workingGroupRequestAnswer });
					goToNextStep();
				}
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			setCommitting(false);
		}
	};

	return <Step active={active} working={committing} onSubmit={handleSubmit} style={stepStyle}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Working_group_request_invite_info_issue_an_answer')}</Box>

				<Box display='flex' flexDirection='column'>

					<Margins all='x8'>
						<Field>
							<Field.Row>
								<Field.Label>{t('Type')}</Field.Label>
							</Field.Row>
							<Field.Row>
								<Select options={typeAnswerOptions} onChange={(val) => setAnswerTypeContext(val)} value={answerTypeContext} placeholder={t('Type')}/>
							</Field.Row>
						</Field>
						{answerTypeContext === 'mail' && <Field>
							<Field.Row height='40px'>
								<Label>
									{t('Working_group_mail')}
								</Label>
							</Field.Row>
							<Field.Row>
								<TextInput placeholder={t('Working_group_mail')} onChange={(event) => setCustomAnswerMailLabel(event.currentTarget.value)} value={customAnswerMailLabel}/>
							</Field.Row>
						</Field>}
						{answerTypeContext === 'protocol' && <Field>
							<Field.Row height='40px'>
								<Label>
									{t('Working_group_request_invite_select_protocol')}
									{protocolSelected
									&& <ClearButton onClick={() => handleClearProtocol()}/>}
									<Button
										onClick={() => setVerticalContext('protocolSelect')}
										backgroundColor='transparent'
										borderColor='transparent'
										style={{ whiteSpace: 'normal' }}>
										{t('Choose')}
									</Button>
								</Label>
							</Field.Row>
							<Field.Row>
								{
									<TextInput readOnly value={protocolSelectLabel} placeholder={t('Working_group_request_invite_select_protocol')}/>
								}
								{/*{!mediaQuery && <Select width='100%' options={protocolsOptions} onChange={handleChangeSelect('protocol')} value={newData.protocol.value} placeholder={t('Working_group_request_invite_select_protocol')}/>}*/}
							</Field.Row>
						</Field>}
						{answerTypeContext === 'protocol' && <Field>
							<Field.Row height='40px'>
								<Label>
									{t('Working_group_request_invite_select_sections')}
									{sectionSelected
									&& <ClearButton onClick={() => handleClearSelectOptions()}/>
									}
									{protocolSelected && <Button
										onClick={() => setVerticalContext('protocolSectionSelect')}
										backgroundColor='transparent'
										borderColor='transparent'
										style={{ whiteSpace: 'normal' }}>
										{t('Choose')}
									</Button>}
								</Label>
							</Field.Row>
							<TextInput disabled={!protocolSelected} readOnly value={protocolSectionSelectLabel} placeholder={t('Working_group_request_invite_select_sections')}/>
						</Field>}
						{answerTypeContext === 'protocol' && <Field>
							<Field.Row height='40px'>
								<Label>
									{t('Working_group_request_invite_select_sections_items')}
									{protocolItemsId && protocolItemsId.length > 0
									&& <ClearButton onClick={() => handleClearSelectItemsOptions()}/>
									}
									{protocolSelected && <Button
										onClick={() => setVerticalContext('protocolItemSelect')}
										backgroundColor='transparent'
										borderColor='transparent'
										style={{ whiteSpace: 'normal' }}>
										{t('Choose')}
									</Button>}
								</Label>
							</Field.Row>
							{/*<TextInput disabled={!protocolSelected} readOnly value={protocolSelectItemLabel} placeholder={t('Working_group_request_invite_select_sections_items')}/>*/}
							<ProtocolItemsField protocolItems={protocolItemsId} handleProtocolItems={setProtocolItemsId} protocolId={protocol?._id ?? ''} onShowChooseButton={false} onShowLabelAndTooltip={false}/>
						</Field>}
						<Field>
							<Field.Label>{t('Commentary')}</Field.Label>
							<Field.Row>
								<TextAreaInput rows='6' style={{ whiteSpace: 'normal', wordBreak: 'break-word' }} value={newData.commentary.value} flexGrow={1} onChange={handleChange('commentary')} />
							</Field.Row>
						</Field>
						<Field mbe='x8'>
							<Field.Label>
								{t('Documents')}
								<span style={ { color: 'red' } }>*</span>
								<span> <Icon name='help' data-for='documentsHelpTooltip' data-tip={ documentsHelpTooltipLabel }/> <ReactTooltip id='documentsHelpTooltip' effect='solid' place='top'/></span>
							</Field.Label>
							<Field border='2px solid #cbced1' mb='5px' width='max-content'>
								<Button id={fileSourceInputId} fontScale='p1' onClick={fileUploadClick} minHeight='2.5rem' border='none' textAlign='left' backgroundColor='var(--color-dark-10)'>
									{t('Working_group_request_invite_add_files')}
								</Button>
							</Field>
							{attachedFile?.length > 0 && <Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x4'>
								<Margins inlineEnd='x4' blockEnd='x4'>
									{attachedFile.map((file, index) =>
										<Chip pi='x4' key={index} onClick={handleFileUploadChipClick(index)}
											border={file.fail ? '2px solid red' : ''} data-for='fileErrorTooltip' data-tip={ file.error ?? '' } style={{ whiteSpace: 'normal' }}>
											{file.name ?? ''}
											<ReactTooltip id='fileErrorTooltip' effect='solid' place='top'/>
										</Chip>)}
								</Margins>
							</Box>}
						</Field>
					</Margins>


				</Box>
			</Box>
		</Margins>

		<Pager disabled={committing} isContinueEnabled={allFieldAreFilled} onBackClick={handleBackClick} />
	</Step>;
}

export default WorkingGroupRequestAnswerFileDownloadStep;
