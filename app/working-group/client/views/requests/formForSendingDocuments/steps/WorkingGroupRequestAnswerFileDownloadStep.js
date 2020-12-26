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

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

const FilterByText = ({ protocolsData, setProtocolsData, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		const regExp = new RegExp('^'.concat(text), 'i');
		console.log(protocolsData);
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
		console.log(selectedDate);
		setStartDate(selectedDate);
		const date = new Date(endDate);
		if (date.getTime() < new Date(startDate).getTime() || !endDate) {
			setEndDate(new Date());
		}
	}, [endDate]);
	const handleEndDateChange = useCallback((selectedDate) => {
		console.log(selectedDate);
		console.log(startDate);
		console.log(new Date(startDate).getTime());
		console.log(new Date(startDate).getTime());
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

const FilterOptions = ({ onChange = () => {}, ...props }) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const [selectedSectionLabel, setSelectedSectionLabel] = useState('');

	const options = useMemo(() => {
		try {
			const renderOption = (label) => <Box display='flex' flexDirection='row' alignItems='center'>
				<Label>{ label }</Label>
			</Box>;

			return [
				['number', renderOption(t('По номеру'))],
				['date', renderOption(t('По дате'))],
			];
		} catch (e) {
			console.log(e);
			return [];
		}
	}, [t]);

	const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = useCursor(-1, options, ([selected], [, hide]) => {
		setFilter(selected);
		reset();
		hide();
	});

	const ref = useRef();
	const onClick = useCallback(() => {
		ref.current.focus() & show();
		ref.current.classList.add('focus-visible');
	}, [show]);

	const handleSelection = useCallback(([selected]) => {
		setFilter(selected);
		reset();
		hide();
	}, [hide, reset]);

	useEffect(() => {
		if (filter !== '') {
			onChange(filter)();
			let index = -1;
			if (filter === 'number') {
				index = 0;
			} else if (filter === 'date') {
				index = 1;
			}
			console.log(options[index]);
			setSelectedSectionLabel(options[index][1] ?? '');
		}
	}, [filter, setSelectedSectionLabel]);

	return (
		<>
			<Button
				{...props}
				height='40px'
				maxHeight='40px'
				display='flex'
				flexGrow={3}
				ref={ref}
				ghost
				textAlign='left'
				onClick={onClick}
				onBlur={hide}
				onKeyUp={handleKeyUp}
				onKeyDown={handleKeyDown}
				fontScale='p1'
				backgroundColor='transparent'
				borderWidth='0.125rem'
				borderColor='var(--rcx-input-colors-border-color, var(--rcx-color-neutral-500, #cbced1))'>
				<Field display='flex' flexDirection='row'>
					<Label width='auto' fontScale='p1'>
						{selectedSectionLabel}
					</Label>
					<Box color='var(--rc-color-primary-dark)' borderColor='transparent' fontFamily='RocketChat' fontSize='1.25rem' mis='auto'></Box>
				</Field>
			</Button>
			<PositionAnimated
				width='350px'
				visible={visible}
				anchor={ref}
				placement={'bottom-end'}
				maxWidth='350px'
			>
				<Options
					width='350px'
					maxWidth='350px'
					onSelect={handleSelection}
					options={options}
					cursor={cursor}/>
			</PositionAnimated>
		</>
	);
};

const SectionOptions = ({ items, selectedSectionLabel, setSelectedSectionLabel, onChange = () => {}, ...props }) => {
	const t = useTranslation();
	const replaceChar = (str) =>
		[...str]?.map((ch, index) => ch).join('') || '';

	const [section, setSection] = useState();

	useMemo(() => selectedSectionLabel === t('Working_group_request_invite_select_sections') ? setSection(-1) : '', [selectedSectionLabel]);

	const options = useMemo(() => {
		try {
			const renderOption = (label) => {
				const tooltipLabel = replaceChar(label);
				const mainLabel = (label?.length > 40 ? label?.slice(0, 40) + '...' : label) || '';
				return <Box display='flex' flexDirection='row' alignItems='center'
					data-for='itemT'
					data-tip={ tooltipLabel } style={{ whiteSpace: 'normal' }} width='350px'>
					<Label>{ mainLabel }</Label>
					<ReactTooltip id='itemT' width='350px' maxWidth='350px' style={{ whiteSpace: 'normal' }}/>
				</Box>;
			};

			return items?.map((item) => [item[0] ?? -1, renderOption(item[1] ?? '')]) || [];
		} catch (e) {
			console.log(e);
			return [];
		}
	}, [t, items]);

	const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = useCursor(-1, options, ([selected], [, hide]) => {
		setSection(selected);
		reset();
		hide();
	});

	const ref = useRef();
	const onClick = useCallback(() => {
		ref.current.focus() & show();
		ref.current.classList.add('focus-visible');
	}, [show]);

	const handleSelection = useCallback(([selected]) => {
		setSection(selected);
		reset();
		hide();
	}, [hide, reset]);

	useEffect(() => {
		if (items.length > 0 && section > -1) {
			onChange('section')(section);
			let label = items[section][1] ?? '';
			label = label.length > 35 ? label.slice(0, 35) + '...' : label;
			setSelectedSectionLabel(label);
		}
	}, [section, setSelectedSectionLabel]);

	return (
		<>
			<Button
				{...props}
				height='40px'
				maxHeight='40px'
				ref={ref}
				ghost
				textAlign='left'
				alignItems='center'
				onClick={onClick}
				onBlur={hide}
				onKeyUp={handleKeyUp}
				onKeyDown={handleKeyDown}
				fontScale='p1'
				borderWidth='0.125rem'
				borderColor='var(--rcx-input-colors-border-color, var(--rcx-color-neutral-500, #cbced1))'>
				<Field display='flex' flexDirection='row'>
					<Label width='90%'
						color={ selectedSectionLabel === t('Working_group_request_invite_select_sections') ? '#9ea2a8' : ''}
						fontScale='p1'
						fontWeight={ selectedSectionLabel === t('Working_group_request_invite_select_sections') ? '400' : '500'}>
						{selectedSectionLabel}
					</Label>
					<Box color='var(--rc-color-primary-dark)' borderColor='transparent' fontFamily='RocketChat' fontSize='1.25rem' mis='auto'></Box>
				</Field>
			</Button>
			<PositionAnimated
				width='350px'
				visible={visible}
				anchor={ref}
				placement={'bottom-end'}
				maxWidth='350px'
			>
				<Options
					width='350px'
					maxWidth='350px'
					onSelect={handleSelection}
					options={options}
					cursor={cursor}/>
			</PositionAnimated>
		</>
	);
};

const SectionItemOptions = ({ items, selectedSectionItemLabel, setSelectedSectionItemLabel, onChange = () => {}, ...props }) => {
	const t = useTranslation();
	const replaceChar = (str) =>
		[...str]?.map((ch, index) => ch).join('') || '';

	const [sectionItem, setSectionItem] = useState(-1);
	console.log(sectionItem);

	useMemo(() => selectedSectionItemLabel === t('Working_group_request_invite_select_sections_items') ? setSectionItem(-1) : '', [selectedSectionItemLabel]);

	const options = useMemo(() => {
		try {
			const renderOption = (label) => {
				const tooltipLabel = replaceChar(label);
				const mainLabel = (label?.length > 40 ? label?.slice(0, 40) + '...' : label) || '';
				return <Box display='flex' flexDirection='row' alignItems='center'
					data-for='itemT'
					data-tip={ tooltipLabel } style={{ whiteSpace: 'normal' }} width='350px'>
					<Label>{ mainLabel }</Label>
					<ReactTooltip id='itemT' width='350px' maxWidth='350px' style={{ whiteSpace: 'normal' }}/>
				</Box>;
			};

			return items?.map((item) => [item[0] ?? -1, renderOption(item[1] ?? '')]) || [];
		} catch (e) {
			console.log(e);
			return [];
		}
	}, [t, items]);

	const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = useCursor(-1, options, ([selected], [, hide]) => {
		setSectionItem(selected);
		reset();
		hide();
	});

	const ref = useRef();
	const onClick = useCallback(() => {
		ref.current.focus() & show();
		ref.current.classList.add('focus-visible');
	}, [show]);

	const handleSelection = useCallback(([selected]) => {
		setSectionItem(selected);
		reset();
		hide();
	}, [hide, reset]);

	useEffect(() => {
		console.log('SUDA SM');
		console.log(sectionItem);
		console.log(items[sectionItem]);
		if (items.length > 0 && sectionItem > -1) {
			onChange('sectionItem')(sectionItem);
			let label = items[sectionItem][1] ?? '';
			label = label.length > 35 ? label.slice(0, 35) + '...' : label;
			setSelectedSectionItemLabel(label);
		}
	}, [sectionItem, setSelectedSectionItemLabel]);

	return (
		<>
			<Button
				{...props}
				height='40px'
				maxHeight='40px'
				ref={ref}
				ghost
				textAlign='left'
				alignItems='center'
				onClick={onClick}
				onBlur={hide}
				onKeyUp={handleKeyUp}
				onKeyDown={handleKeyDown}
				fontScale='p1'
				borderWidth='0.125rem'
				borderColor='var(--rcx-input-colors-border-color, var(--rcx-color-neutral-500, #cbced1))'>
				<Field display='flex' flexDirection='row'>
					<Label width='90%'
						color={ selectedSectionItemLabel === t('Working_group_request_invite_select_sections_items') ? '#9ea2a8' : ''}
						fontScale='p1'
						fontWeight={ selectedSectionItemLabel === t('Working_group_request_invite_select_sections_items') ? '400' : '500'}>
						{selectedSectionItemLabel}
					</Label>
					<Box color='var(--rc-color-primary-dark)' borderColor='transparent' fontFamily='RocketChat' fontSize='1.25rem' mis='auto'></Box>
				</Field>
			</Button>
			<PositionAnimated
				width='350px'
				visible={visible}
				anchor={ref}
				placement={'bottom-end'}
				maxWidth='350px'
			>
				<Options
					width='350px'
					maxWidth='350px'
					onSelect={handleSelection}
					options={options}
					cursor={cursor}/>
			</PositionAnimated>
		</>
	);
};

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
	const [filterContext, setFilterContext] = useState('');
	const [protocolSelectLabel, setProtocolSelectLabel] = useState('');
	const [protocolsFindData, setProtocolsFindData] = useState([]);
	const [sectionOptionSelectedLabel, setSectionOptionSelectedLabel] = useState(t('Working_group_request_invite_select_sections'));
	const [sectionItemOptionSelectedLabel, setSectionItemOptionSelectedLabel] = useState(t('Working_group_request_invite_select_sections_items'));

	const addWorkingGroupRequestAnswer = useMethod('addWorkingGroupRequestAnswer');

	const fileSourceInputId = useUniqueId();
	const workingGroupRequestId = workingGroupRequest._id;
	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const mails = useMemo(() => workingGroupRequest.mails, [workingGroupRequest]);

	const isAnyMails = useMemo(() => workingGroupRequest?.mails?.length > 0 || false, [workingGroupRequest]);
	const mailsOptions = useMemo(() => mails?.map((mail) => [mail._id, (mail.number ?? t('Working_group_request_invite_not_mail_chosen')) + (mail.ts ? ' от ' + formatDate(mail.ts) : '')] || [null, t('Working_group_request_invite_not_mail_chosen')]), [mails]);
	const protocolsOptions = useMemo(() => protocolsData?.map((protocol, index) => [index, protocol.num ?? '']) || [], [protocolsData]);

	useEffect(() => {
		if (protocolSelectLabel === '') {
			setProtocolSelectLabel(t('Working_group_request_invite_select_protocol'));
		}
		setProtocolsFindData(protocolsData ?? []);
	}, [t, protocolsData]);

	const filterName = (name) => {
		const regExp = new RegExp('(<[a-z]*[0-9]*>)*(</[a-z]*[0-9]*>)*', 'gi');
		return name.replaceAll(regExp, '');
	};

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
	};

	const handleChangeSelect = (field) => (val) => {
		console.log('handle change select');
		console.log(field, val);
		const updateData = Object.assign({}, newData);

		if (field === 'protocol' && val !== newData.protocol.value) {
			const options = protocolsData[val]?.sections?.map((section, index) => [index, [section.num ?? '', ': ', section.name ? filterName(section.name) : ''].join('')]) || [];
			setSectionOptions(options);
			setSectionItemsOptions([]);
			updateData.sectionItem = { value: '', required: newData.sectionItem.required };
			updateData.section = { value: '', required: newData.section.required };
			setSectionOptionSelectedLabel(t('Working_group_request_invite_select_sections'));
			setSectionItemOptionSelectedLabel(t('Working_group_request_invite_select_sections_items'));
		}
		if (field === 'section' && val !== newData.section.value) {
			const options = protocolsData[newData.protocol.value]?.sections[val]?.items?.map((item, index) => [index, [item.num ?? '', ': ', item.name ? filterName(item.name) : ''].join('')]) || [];
			setSectionItemsOptions(options);
			updateData.sectionItem = { value: '', required: newData.sectionItem.required };
			if (val === '') {
				updateData.section = { value: '', required: newData.section.required };
			}
			setSectionItemOptionSelectedLabel(t('Working_group_request_invite_select_sections_items'));
		}
		if (field === 'sectionItem' && val === '') {
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

	const handleFilterContext = (filter) => () => {
		if (filter !== filterContext) {
			console.log(protocolsData);
			setFilterContext(filter);
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
			const protocolLabel = [t('Protocol'), '№', protocolsData[index].num, 'от', formatDate(protocolsData[index].d)].join(' ');
			setProtocolSelectLabel(protocolLabel);
			handleChangeSelect(field)(index);
		}
		setContext('');
	};

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Working_group_request_invite_info_issue_an_answer')}</Box>

				<Box display='flex' flexDirection='column'>

					<Margins all='x8'>
						<Field>
							<Field.Row height='40px'>
								<Label>
									{t('Working_group_request_select_mail')}
									{newData.numberId.value !== ''
									&& <Button onClick={() => { handleChangeSelect('numberId')(''); }} backgroundColor='transparent' borderColor='transparent' danger label={t('Clear')}>
										<Icon size={16} name='refresh'/>
									</Button>}
								</Label>
							</Field.Row>
							<Field.Row>
								{isAnyMails && <Select options={mailsOptions} onChange={handleChangeSelect('numberId')} value={newData.numberId.value} placeholder={t('Number')}/>}
								{!isAnyMails && <TextInput disabled readOnly value={t('Working_group_request_invite_not_mail_chosen')}/>}
							</Field.Row>
						</Field>
						<Field>
							<Field.Row height='40px'>
								<Label>
									{t('Working_group_request_invite_select_protocol')}
									{newData.protocol.value !== ''
									&& <Button onClick={() => {
										handleChangeSelect('sectionItem')('');
										setSectionItemOptionSelectedLabel(t('Working_group_request_invite_select_sections_items'));
										handleChangeSelect('section')('');
										setSectionOptionSelectedLabel(t('Working_group_request_invite_select_sections'));
										handleChangeSelect('protocol')('');
										setProtocolSelectLabel(t('Working_group_request_invite_select_protocol'));
									}} backgroundColor='transparent' borderColor='transparent' danger>
										<Icon size={16} name='refresh'/>
									</Button>}
								</Label>
							</Field.Row>
							<Field.Row>
								{mediaQuery && <Button backgroundColor={protocolsData.length === 0 ? '#f2f3f5' : 'transparent'} disabled={protocolsData.length === 0} textAlign='left' onClick={handleChangeContext('protocolSelect')} fontScale='p1' display='inline-flex' flexGrow={1} borderWidth='0.125rem' borderColor='var(--rcx-input-colors-border-color, var(--rcx-color-neutral-500, #cbced1))'>
									<Label width='100%' disabled={protocolsData.length === 0}
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
										<Field.Label>{t('Search')}:</Field.Label>
										<FilterOptions onChange={handleFilterContext}/>
									</Field.Row>
									{filterContext === 'date' && <FilterByDateRange protocolsData={protocolsData} setProtocolsData={setProtocolsFindData}/>}
									{filterContext === 'number' && <FilterByText protocolsData={protocolsData} setProtocolsData={setProtocolsFindData}/>}
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
						</Field>
						<Field>
							<Field.Row height='40px'>
								<Label>
									{t('Working_group_request_invite_select_sections')}
									{newData.section.value !== ''
									&& <Button onClick={() => {
										handleChangeSelect('sectionItem')('');
										setSectionItemOptionSelectedLabel(t('Working_group_request_invite_select_sections_items'));
										handleChangeSelect('section')('');
										setSectionOptionSelectedLabel(t('Working_group_request_invite_select_sections'));
									}} backgroundColor='transparent' borderColor='transparent' danger>
										<Icon size={16} name='refresh'/>
									</Button>}
								</Label>
							</Field.Row>
							<SectionOptions backgroundColor={sectionsOptions.length === 0 ? '#f2f3f5' : 'transparent' } disabled={(sectionsOptions.length === 0)} items={sectionsOptions} selectedSectionLabel={sectionOptionSelectedLabel} setSelectedSectionLabel={setSectionOptionSelectedLabel} onChange={handleChangeSelect}/>
						</Field>
						{/*<Field>*/}
						{/*	<Field.Label>{t('Working_group_request_invite_select_sections')}</Field.Label>*/}
						{/*	<Field.Row>*/}
						{/*		<Select width='100%' options={sectionsOptions} disabled={(sectionsOptions.length === 0)} onChange={handleChangeSelect('section')} placeholder={t('Working_group_request_invite_select_sections')} />*/}
						{/*	</Field.Row>*/}
						{/*</Field>*/}
						<Field>
							<Field.Row height='40px'>
								<Label>
									{t('Working_group_request_invite_select_sections_items')}
									{newData.sectionItem.value !== ''
									&& <Button onClick={() => { handleChangeSelect('sectionItem')(''); setSectionItemOptionSelectedLabel(t('Working_group_request_invite_select_sections_items')); }} backgroundColor='transparent' borderColor='transparent' danger>
										<Icon size={16} name='refresh'/>
									</Button>}
								</Label>
							</Field.Row>
							<SectionItemOptions backgroundColor={sectionsItemsOptions.length === 0 ? '#f2f3f5' : 'transparent' } disabled={(sectionsItemsOptions.length === 0)} items={sectionsItemsOptions} selectedSectionItemLabel={sectionItemOptionSelectedLabel} setSelectedSectionItemLabel={setSectionItemOptionSelectedLabel} onChange={handleChangeSelect}/>
						</Field>
						{/*<Field>*/}
						{/*	<Field.Label>{t('Working_group_request_invite_select_sections_items')}</Field.Label>*/}
						{/*	<Field.Row>*/}
						{/*		<Select width='100%' options={sectionsItemsOptions} disabled={(sectionsItemsOptions.length === 0)} onChange={handleChangeSelect('sectionItem')} value={newData.sectionItem.value} placeholder={t('Working_group_request_invite_select_sections_items')}/>*/}
						{/*	</Field.Row>*/}
						{/*</Field>*/}
						<Field>
							<Field.Label>{t('Commentary')}</Field.Label>
							<Field.Row>
								<TextAreaInput rows='3' style={{ whiteSpace: 'normal' }} value={newData.commentary.value} flexGrow={1} onChange={handleChange('commentary')} />
							</Field.Row>
						</Field>
						<Field mbe='x8'>
							<Field.Label>{t('Documents')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field border='2px solid #cbced1' mb='5px' width='45%'>
								<Button id={fileSourceInputId} fontScale='p1' onClick={fileUploadClick} minHeight='2.5rem' border='none' textAlign='left' backgroundColor='var(--color-dark-10)'>
									{t('Add_files')}
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
