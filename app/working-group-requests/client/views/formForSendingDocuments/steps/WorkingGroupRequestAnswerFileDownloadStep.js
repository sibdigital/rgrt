import {
	Button, Box, Field,
	Chip, Label,
	Margins, Select, Icon, Tile,
	TextInput, TextAreaInput,
	Table, Options, useCursor, PositionAnimated,
} from '@rocket.chat/fuselage';
import { useMediaQuery, useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { CustomSelectOptions } from '../CustomSelectOptions';
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

function WorkingGroupRequestAnswerFileDownloadStep({ step, title, active, workingGroupRequest, protocolsData, setInfo }) {
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
	const [context, setContext] = useState('');
	const [filterContext, setFilterContext] = useState(-1);
	const [protocolSelectLabel, setProtocolSelectLabel] = useState('');
	const [protocolsFindData, setProtocolsFindData] = useState([]);
	const [staticFileIndex, setStaticFileIndex] = useState(0);
	const [answerMailLabel, setAnswerMailLabel] = useState(t('Working_group_request_invite_not_mail_chosen'));
	const [answerTypeContext, setAnswerTypeContext] = useState('mail');

	const fileSourceInputId = useUniqueId();
	const workingGroupRequestId = workingGroupRequest._id;
	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const documentsHelpTooltipLabel = useMemo(() => 'Загрузите не пустые файлы', []);
	const protocolsOptions = useMemo(() => protocolsData?.map((protocol, index) => [index, protocol.num ?? '']) || [], [protocolsData]);
	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value === '' && current.required === true).length === 0 && attachedFile.length > 0, [newData, attachedFile]);
	const typeAnswerOptions = useMemo(() => [['mail', t('Working_group_request_select_mail')], ['protocol', t('Working_group_request_invite_select_protocol')]], [t]);
	const customAnswerMailLabel = useMemo(() =>
		workingGroupRequest.number && workingGroupRequest.date
			? ['#', workingGroupRequest.number, ' от ', formatDate(workingGroupRequest.date)].join('')
			: t('Working_group_request_invite_not_mail_chosen')
	, [t, workingGroupRequest]);

	useEffect(() => {
		if (protocolSelectLabel === '') {
			setProtocolSelectLabel(t('Working_group_request_invite_select_protocol'));
		}
		setProtocolsFindData(protocolsData ?? []);
		workingGroupRequest.number && workingGroupRequest.date && setAnswerMailLabel(['#', workingGroupRequest.number, ' от ', formatDate(workingGroupRequest.date)].join(''));
	}, [t, protocolsData, workingGroupRequest]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, [cache]);

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
	};

	const handleChangeSelect = useCallback((field) => (val) => {
		console.log('handle change select');
		// console.log(field, val);
		const updateData = Object.assign({}, newData);

		if (field === 'protocol' && val !== newData.protocol.value) {
			const options = protocolsData[val]?.sections?.map((section, index) => [index, [section.num ?? '', ': ', section.name ? preProcessingProtocolItems(section.name) : ''].join('')]) || [];
			setSectionOptions(options);
			setSectionItemsOptions([]);
			updateData.sectionItem = { value: '', required: newData.sectionItem.required };
			updateData.section = { value: '', required: newData.section.required };
		}
		if (field === 'section' && val !== newData.section.value) {
			const options = protocolsData[newData.protocol.value]?.sections[val]?.items?.map((item, index) => [index, [item.num ?? '', ': ', item.name ? preProcessingProtocolItems(item.name) : ''].join('')]) || [];
			console.log(val);
			console.log(options);
			setSectionItemsOptions(options);
			updateData.sectionItem = { value: '', required: newData.sectionItem.required };
		}
		updateData[field] = { value: val, required: newData[field].required };
		// console.log(updateData);
		setNewData(updateData);
	}, [newData, protocolsData]);

	const handleClearSelectItemsOptions = useCallback((isOptionsClear = false) => {
		if (isOptionsClear) {
			setSectionItemsOptions([]);
		}
		setNewData({ ...newData, sectionItem: { value: '', required: newData.sectionItem.required } });
	}, [newData, setSectionItemsOptions]);

	const handleClearSelectOptions = useCallback((isOptionsClear = false) => {
		handleClearSelectItemsOptions(true);
		if (isOptionsClear) {
			setSectionOptions([]);
		}
		setNewData({ ...newData, section: { value: '', required: newData.section.required }, sectionItem: { value: '', required: newData.sectionItem.required } });
	}, [newData, handleClearSelectItemsOptions]);

	const handleClearProtocol = useCallback(() => {
		handleClearSelectOptions(true);
		setNewData({ ...newData, protocol: { value: '', required: newData.protocol.required }, section: { value: '', required: newData.section.required }, sectionItem: { value: '', required: newData.sectionItem.required } });
	}, [newData, handleClearSelectOptions]);

	const handleChangeContext = useCallback((contextField) => () => {
		if (context === '') {
			setProtocolsFindData(protocolsData);
			setFilterContext(-1);
			setContext(contextField);
		} else {
			setContext('');
		}
	}, [context]);

	const handleFilterContext = useCallback((filter) => {
		console.log(filter);
		if (filter !== filterContext) {
			// console.log(protocolsData);
			setFilterContext(filter);
		}
	}, [filterContext]);

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
			const protocolData = protocolsData[newData.protocol.value];
			const sectionData = protocolData.sections[newData.section.value];
			const sectionItemData = sectionData.items[newData.sectionItem.value];
			dataToSend.protocol = {
				_id: protocolData._id,
				title: [t('Protocol'), '№', protocolData.num, t('Date_From'), formatDate(protocolData.d)].join(' '),
				section: {
					_id: sectionData._id,
					title: [sectionData.num ?? '', ': ', sectionData.name ? preProcessingProtocolItems(sectionData.name) : ''].join(''),
				},
				sectionItem: {
					_id: sectionItemData._id,
					title: [sectionItemData.num ?? '', ': ', sectionItemData.name ? preProcessingProtocolItems(sectionItemData.name) : ''].join(''),
				},
			};
			dataToSend.protocolId = protocolData._id;
			dataToSend.sectionId = sectionData._id;
			dataToSend.sectionItemId = sectionItemData._id;
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
					goToNextStep();
				}
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			setCommitting(false);
		}
	};

	const onRowClick = (field, id) => () => {
		const index = protocolsData.findIndex((protocol) => protocol._id === id);
		if (index > -1) {
			const protocolLabel = [t('Protocol'), '№', protocolsData[index].num, 'от', formatDate(protocolsData[index].d)].join(' ');
			setProtocolSelectLabel(protocolLabel);
			handleChangeSelect(field)(index);
		}
		setContext('');
	};

	const SectionsSelect = useMemo(() => <CustomSelectOptions
		backgroundColor={sectionsOptions.length === 0 ? '#f2f3f5' : 'transparent' }
		disabled={sectionsOptions.length === 0}
		items={sectionsOptions}
		defaultSelectedLabel={t('Working_group_request_invite_select_sections')}
		onChange={handleChangeSelect('section')}
		active={newData.section.value !== ''}
	/>, [sectionsOptions, newData.section, t]);

	const SectionItemsSelect = useMemo(() => <CustomSelectOptions
		backgroundColor={sectionsItemsOptions.length === 0 ? '#f2f3f5' : 'transparent' }
		disabled={sectionsItemsOptions.length === 0}
		items={sectionsItemsOptions}
		defaultSelectedLabel={t('Working_group_request_invite_select_sections_items')}
		onChange={handleChangeSelect('sectionItem')}
		active={newData.sectionItem.value !== ''}
	/>, [sectionsItemsOptions, newData.sectionItem, t]);

	return <Step active={active} working={committing} onSubmit={handleSubmit} style={{ maxWidth: '450px' }}>
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
									{t('Working_group_request_select_mail')}
								</Label>
							</Field.Row>
							<Field.Row>
								<TextInput disabled readOnly value={customAnswerMailLabel}/>
							</Field.Row>
						</Field>}
						{answerTypeContext === 'protocol' && <Field>
							<Field.Row height='40px'>
								<Label>
									{t('Working_group_request_invite_select_protocol')}
									{newData.protocol.value !== ''
									&& <ClearButton onClick={() => { handleClearProtocol(); setProtocolSelectLabel(t('Working_group_request_invite_select_protocol')); }}/>}
								</Label>
							</Field.Row>
							<Field.Row>
								{mediaQuery && <Button backgroundColor={protocolsData.length === 0 ? '#f2f3f5' : 'transparent'} disabled={protocolsData.length === 0} textAlign='left' onClick={handleChangeContext('protocolSelect')} fontScale='p1' display='inline-flex' flexGrow={1} borderWidth='0.125rem' borderColor='var(--rcx-input-colors-border-color, var(--rcx-color-neutral-500, #cbced1))'>
									<Label
										width='100%' disabled={protocolsData.length === 0}
										color={ protocolSelectLabel === t('Working_group_request_invite_select_protocol') ? '#9ea2a8' : ''}
										fontScale='p1'
										fontWeight={ protocolSelectLabel === t('Working_group_request_invite_select_protocol') ? '400' : '500'}>
										{protocolsData.length === 0 ? t('Working_group_request_invite_not_protocol_chosen') : protocolSelectLabel}
									</Label>
									<Box color='var(--rc-color-primary-dark)' fontFamily='RocketChat' fontSize='1.25rem' mis='auto'></Box>
								</Button>}
								{!mediaQuery && <Select width='100%' options={protocolsOptions} onChange={handleChangeSelect('protocol')} value={newData.protocol.value} placeholder={t('Working_group_request_invite_select_protocol')}/>}
							</Field.Row>
							<Field.Row maxHeight='500px'>
								{context === 'protocolSelect'
								&& mediaQuery && <Field mb='x4'>
									<Field.Row>
										<Field.Label alignSelf='center' mie='x16'>{t('Search')}:</Field.Label>
										<CustomSelectOptions items={ [[0, 'По номеру'], [1, 'По дате']] } onChange={handleFilterContext} active backgroundColor='#ffffff' showLabelTooltip={false}/>
									</Field.Row>
									{filterContext === 1 && <FilterByDateRange protocolsData={protocolsData} setProtocolsData={setProtocolsFindData}/>}
									{filterContext === 0 && <FilterByText protocolsData={protocolsData} setProtocolsData={setProtocolsFindData}/>}
									{ protocolsFindData && !protocolsFindData.length
										? <>
											<Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
												{ t('No_data_found') }
											</Tile>
										</>
										: <>
											<ProtocolsTable protocolsData={ protocolsFindData } onRowClick={ onRowClick }/>
										</>
									}
								</Field>}
							</Field.Row>
						</Field>}
						{answerTypeContext === 'protocol' && <Field>
							<Field.Row height='40px'>
								<Label>
									{t('Working_group_request_invite_select_sections')}
									{newData.section.value !== ''
										&& <ClearButton onClick={() => handleClearSelectOptions(false)}/>
									}
								</Label>
							</Field.Row>
							{ SectionsSelect }
						</Field>}
						{answerTypeContext === 'protocol' && <Field>
							<Field.Row height='40px'>
								<Label>
									{t('Working_group_request_invite_select_sections_items')}
									{newData.sectionItem.value !== ''
										&& <ClearButton onClick={() => handleClearSelectItemsOptions(false)}/>
									}
								</Label>
							</Field.Row>
							{ SectionItemsSelect }
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

function ProtocolsTable({ protocolsData, onRowClick }) {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const headerProtocol = useMemo(() => [
		mediaQuery && <Th key={'Number'} color='default'>{t('Number')}</Th>,
		mediaQuery && <Th key={'Section_Name'} color='default'>{t('Section_Name')}</Th>,
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

	return <GenericTable header={headerProtocol} renderRow={renderProtocolRow} results={protocolsData} total={protocolsData.length} setParams={setParams} params={params} />;
}
